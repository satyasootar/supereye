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
        <div className="mx-auto flex h-screen w-full max-w-[1600px] flex-col overflow-hidden border-x border-border-subtle bg-bg-app shadow-2xl">
          <CommandPalette />
          <main className="flex-1 overflow-hidden">{children}</main>
        </div>
      </KeyboardSystem>
    </QueryProvider>
  );
}
