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

import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';

import { users, accounts, sessions, verificationTokens } from '@/lib/db/schema';
import { bootstrapUserBilling } from '@/lib/billing/seed';
import { ensureUserHasSubscription } from '@/lib/billing/admin';
import { touchUserActivity } from '@/lib/billing/rbac';
import { authenticateWithPassword } from '@/lib/auth/credentials';
import { isDemoAccountEmail } from '@/lib/auth/demo-account';
import { upsertUserPreferences } from '@/lib/user/preferences';

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
          typeof credentials?.email === 'string' ? credentials.email : '';
        const password =
          typeof credentials?.password === 'string' ? credentials.password : '';

        if (!email || !password) return null;

        const user = await authenticateWithPassword(email, password);
        if (!user) return null;

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
    async signIn({ user }) {
      if (user.id) {
        await bootstrapUserBilling(user.id, user.email);
        await ensureUserHasSubscription(user.id);

        if (isDemoAccountEmail(user.email)) {
          await upsertUserPreferences(user.id, {
            onboardingCompleted: false,
            botSettings: { workspaceTourCompleted: false },
          });
        }
      }
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      }

      const userId = (token.id as string | undefined) ?? token.sub;
      if (userId) {
        const [dbUser] = await db
          .select({ role: users.role, status: users.status })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);
        token.role = dbUser?.role ?? 'user';
        token.status = dbUser?.status ?? 'active';
      }

      return token;
    },
    async session({ session, token }) {
      const userId = (token.id as string | undefined) ?? token.sub;
      if (!userId) return session;

      session.user.id = userId;
      session.user.role =
        (token.role as 'super_admin' | 'user' | 'enterprise_user') ?? 'user';
      session.user.status = (token.status as 'active' | 'suspended') ?? 'active';
      await touchUserActivity(userId);
      return session;
    },
    authorized({ auth, request }) {
      const path = request.nextUrl.pathname;
      const isLoggedIn = !!auth?.user;

      if (path.startsWith('/admin')) {
        if (!isLoggedIn) return false;
        if (auth.user.role !== 'super_admin') {
          return Response.redirect(new URL('/workspace', request.nextUrl));
        }
        return true;
      }

      if (path === '/' || path.startsWith('/login') || path.startsWith('/signup')) return true;
      if (
        path === '/forgot-password' ||
        path === '/reset-password' ||
        path.startsWith('/forgot-password/') ||
        path.startsWith('/reset-password/')
      ) {
        return true;
      }
      if (
        path === '/about' ||
        path === '/privacy' ||
        path === '/terms' ||
        path.startsWith('/about/') ||
        path.startsWith('/privacy/') ||
        path.startsWith('/terms/')
      ) {
        return true;
      }

      return isLoggedIn;
    },
  },
  pages: {
    signIn: '/login',
  },
});
