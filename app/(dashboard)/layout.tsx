import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { QueryProvider } from '@/components/providers/query-provider';
import { TopBar } from '@/components/os/top-bar';
import { CommandPalette } from '@/components/os/command-palette';

/**
 * Dashboard layout — requires authentication.
 * Wraps children in the query provider.
 * Includes top navbar and will house sidebar in future phases.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  return (
    <QueryProvider>
      <div className="flex h-screen w-full flex-col overflow-hidden bg-app">
        <TopBar />
        <CommandPalette />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </QueryProvider>
  );
}
