/**
 * Route protection middleware.
 * Redirects unauthenticated users to /login.
 * Limits auth checks to app pages and skips API routes plus Next internals.
 */
export { auth as proxy } from '@/lib/auth';

export const config = {
  matcher: [
    /*
     * Match app pages only.
     * Skip:
     * - /api (route handlers do their own auth checks)
     * - /_next (Next.js internals, HMR, assets)
     * - metadata files and other file-extension assets
     */
    '/((?!api|_next|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)',
  ],
};
