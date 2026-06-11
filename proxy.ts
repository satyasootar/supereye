/**
 * Route protection middleware.
 * Redirects unauthenticated users to /login.
 * Excludes auth routes, Corsair routes, webhooks, and static assets.
 */
export { auth as proxy } from '@/lib/auth';

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - /login (auth page)
     * - /api/auth (NextAuth routes)
     * - /api/corsair (Corsair OAuth callback)
     * - /api/webhooks (incoming webhooks from Google)
     * - /_next (Next.js internals)
     * - /favicon.ico, /public assets
     */
    '/((?!login|api/auth|api/corsair|api/webhooks|_next/static|_next/image|favicon.ico).*)',
  ],
};
