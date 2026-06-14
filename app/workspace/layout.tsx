import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { QueryProvider } from '@/components/providers/query-provider';
import { CommandPalette } from '@/components/os/command-palette';
import { KeyboardSystem } from '@/components/keyboard/keyboard-system';

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
      <KeyboardSystem>
        <div className="flex h-screen w-full flex-col overflow-hidden bg-bg-app">
          <CommandPalette />
          <main className="flex-1 overflow-hidden">{children}</main>
        </div>
      </KeyboardSystem>
    </QueryProvider>
  );
}
