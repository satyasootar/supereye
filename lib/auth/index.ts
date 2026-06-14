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
import { db } from '@/lib/db';

import { users, accounts, sessions, verificationTokens } from '@/lib/db/schema';

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
  callbacks: {
    session({ session, user }) {
      // Attach user.id to session — used as Corsair tenantId
      session.user.id = user.id;
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
});
