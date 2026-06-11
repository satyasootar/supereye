import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { QueryProvider } from '@/components/providers/query-provider';
import { SessionProvider } from '@/components/providers/session-provider';

/**
 * Dashboard layout — requires authentication.
 * Wraps children in session + query providers.
 * Includes top navbar and will house sidebar in future phases.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <SessionProvider>
      <QueryProvider>
        <div className="flex min-h-svh flex-col">
          {/* Navbar */}
          <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border/50 bg-background/80 px-6 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500">
                <svg
                  className="h-4 w-4 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <span className="text-base font-semibold tracking-tight">
                Supereye
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* User avatar */}
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name ?? 'User'}
                  className="h-8 w-8 rounded-full ring-2 ring-border"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
                  {session.user.name?.charAt(0) ?? '?'}
                </div>
              )}
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1">{children}</main>
        </div>
      </QueryProvider>
    </SessionProvider>
  );
}
