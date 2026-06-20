/**
 * NextAuth v5 configuration.
 * Supports Google OAuth and email/password credentials.
 *
 * User authentication (login/session) is separate from Corsair integrations
 * (Gmail/Calendar API access).
 */
if (!process.env.AUTH_URL && process.env.NEXT_PUBLIC_APP_URL) {
  process.env.AUTH_URL = process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
}

import { headers } from 'next/headers';
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';

import { users, accounts, sessions, verificationTokens } from '@/lib/db/schema';
import { bootstrapUserBilling } from '@/lib/billing/seed';
import { ensureUserHasSubscription } from '@/lib/billing/admin';
import { getUserAccess, touchUserActivity } from '@/lib/billing/rbac';
import { authenticateWithPassword } from '@/lib/auth/credentials';
import { normalizeUserEmail } from '@/lib/auth/normalize-email';
import { isDemoAccountEmail } from '@/lib/auth/demo-account';
import { ensureDemoAccountProPlan } from '@/lib/billing/demo';
import { DEFAULT_BOT_SETTINGS } from '@/lib/plugins/types';
import { upsertUserPreferences } from '@/lib/user/preferences';
import { getClientIp } from '@/lib/auth/client-ip';
import {
  assertLoginAllowed,
  clearLoginAttemptsForEmail,
  recordFailedLoginAttempt,
} from '@/lib/auth/login-rate-limit';
import { LoginRateLimitedError, DemoLoginDisabledError } from '@/lib/auth/sign-in-errors';
import { isSessionVersionValid } from '@/lib/auth/session-version';
import { endActiveUserSession, recordUserLogin } from '@/lib/monitoring/activity';
import { getPlatformSettings } from '@/lib/platform/settings';

function isPublicAuthPath(path: string): boolean {
  return (
    path === '/' ||
    path.startsWith('/login') ||
    path.startsWith('/signup') ||
    path === '/forgot-password' ||
    path === '/reset-password' ||
    path.startsWith('/forgot-password/') ||
    path.startsWith('/reset-password/') ||
    path === '/about' ||
    path === '/privacy' ||
    path === '/terms' ||
    path.startsWith('/about/') ||
    path.startsWith('/privacy/') ||
    path.startsWith('/terms/')
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: {
    strategy: 'jwt',
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    Credentials({
      id: 'credentials',
      name: 'Email and Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === 'string'
            ? normalizeUserEmail(credentials.email)
            : '';
        const password =
          typeof credentials?.password === 'string' ? credentials.password : '';

        if (!email || !password) return null;

        if (isDemoAccountEmail(email)) {
          const { demoLoginEnabled } = await getPlatformSettings();
          if (!demoLoginEnabled) {
            throw new DemoLoginDisabledError();
          }
        }

        const headerList = await headers();
        const ip = getClientIp(headerList);
        const rateLimitReason = await assertLoginAllowed(ip, email);
        if (rateLimitReason) {
          throw new LoginRateLimitedError();
        }

        const user = await authenticateWithPassword(email, password);
        if (!user) {
          await recordFailedLoginAttempt(ip, email);
          return null;
        }

        await clearLoginAttemptsForEmail(email);
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  events: {
    async signIn({ user, account }) {
      if (user.id && user.email) {
        const normalized = normalizeUserEmail(user.email);
        if (normalized !== user.email) {
          await db
            .update(users)
            .set({ email: normalized, updatedAt: new Date() })
            .where(eq(users.id, user.id));
        }
      }

      if (user.id) {
        await bootstrapUserBilling(user.id, user.email);
        await ensureUserHasSubscription(user.id);

        await recordUserLogin(user.id, account?.provider ?? 'credentials');

        if (isDemoAccountEmail(user.email)) {
          await ensureDemoAccountProPlan(user.id);
          await upsertUserPreferences(user.id, {
            onboardingCompleted: false,
            botSettings: {
              ...DEFAULT_BOT_SETTINGS,
              workspaceTourCompleted: false,
            },
          });
        }
      }
    },
    async signOut(message) {
      const token = 'token' in message ? message.token : null;
      const userId = (token?.id as string | undefined) ?? token?.sub;
      if (userId) {
        await endActiveUserSession(userId, new Date(), 'sign_out');
      }
    },
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.id) return true;
      const access = await getUserAccess(user.id);
      if (access?.status === 'suspended') return false;
      return true;
    },
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      }

      const userId = (token.id as string | undefined) ?? token.sub;
      if (!userId) return token;

      const [dbUser] = await db
        .select({
          role: users.role,
          status: users.status,
          sessionVersion: users.sessionVersion,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!dbUser || dbUser.status === 'suspended') {
        return { ...token, sessionInvalid: true as const };
      }

      const dbVersion = dbUser.sessionVersion ?? 0;
      const tokenVersion =
        typeof token.sessionVersion === 'number' ? token.sessionVersion : undefined;

      if (user?.id) {
        token.sessionVersion = dbVersion;
        delete token.sessionInvalid;
      } else if (!isSessionVersionValid(tokenVersion, dbVersion)) {
        return { ...token, sessionInvalid: true as const };
      } else {
        token.sessionVersion = dbVersion;
        delete token.sessionInvalid;
      }

      token.role = dbUser.role ?? 'user';
      token.status = dbUser.status ?? 'active';

      return token;
    },
    async session({ session, token }) {
      if (token.sessionInvalid) {
        return {
          ...session,
          user: {
            ...session.user,
            id: '',
            role: 'user',
            status: 'suspended',
          },
          error: 'SessionInvalid',
        };
      }

      const userId = (token.id as string | undefined) ?? token.sub;
      if (!userId) return session;

      session.user.id = userId;
      session.user.role =
        (token.role as 'super_admin' | 'admin' | 'user' | 'enterprise_user') ?? 'user';
      session.user.status = (token.status as 'active' | 'suspended') ?? 'active';
      await touchUserActivity(userId);
      return session;
    },
    authorized({ auth, request }) {
      const path = request.nextUrl.pathname;
      const hasValidSession = !!auth?.user?.id && auth.error !== 'SessionInvalid';
      const isSuspended =
        hasValidSession && auth?.user?.status === 'suspended';

      if (isSuspended) {
        if (isPublicAuthPath(path)) return true;
        const loginUrl = new URL('/login', request.nextUrl);
        loginUrl.searchParams.set('suspended', '1');
        return Response.redirect(loginUrl);
      }

      if (path.startsWith('/admin')) {
        if (!hasValidSession) return false;
        if (auth.user.role !== 'super_admin' && auth.user.role !== 'admin') {
          return Response.redirect(new URL('/workspace', request.nextUrl));
        }
        return true;
      }

      if (isPublicAuthPath(path)) return true;

      return hasValidSession;
    },
  },
  pages: {
    signIn: '/login',
  },
});
