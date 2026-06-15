/**
 * NextAuth v5 configuration.
 * Uses Google OAuth for sign-in with Drizzle adapter for Postgres persistence.
 *
 * This handles USER AUTHENTICATION only (login/session).
 * Gmail/Calendar API access is handled separately by Corsair.
 */
// Pin OAuth callbacks to the public app URL (ngrok in dev, production domain in prod).
// Without this, signing in via http://localhost:3000 sends a localhost redirect_uri
// that won't match Google Console when only the ngrok URI is registered.
if (!process.env.AUTH_URL && process.env.NEXT_PUBLIC_APP_URL) {
  process.env.AUTH_URL = process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
}

import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';

import { users, accounts, sessions, verificationTokens } from '@/lib/db/schema';
import { bootstrapUserBilling } from '@/lib/billing/seed';
import { ensureUserHasSubscription } from '@/lib/billing/admin';
import { touchUserActivity } from '@/lib/billing/rbac';

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  events: {
    async signIn({ user }) {
      if (user.id) {
        await bootstrapUserBilling(user.id, user.email);
        await ensureUserHasSubscription(user.id);
      }
    },
  },
  callbacks: {
    async session({ session, user }) {
      session.user.id = user.id;
      const [dbUser] = await db
        .select({ role: users.role, status: users.status })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);
      session.user.role = dbUser?.role ?? 'user';
      session.user.status = dbUser?.status ?? 'active';
      await touchUserActivity(user.id);
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

      if (path === '/' || path.startsWith('/login')) return true;

      return isLoggedIn;
    },
  },
  pages: {
    signIn: '/login',
  },
});
