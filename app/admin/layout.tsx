import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { requireAdminPanel } from '@/lib/billing/rbac';
import { ensureBillingSeed } from '@/lib/billing/seed';
import { AdminShell } from '@/components/admin/admin-shell';
import { QueryProvider } from '@/components/providers/query-provider';
import { ActivityHeartbeat } from '@/components/monitoring/activity-heartbeat';
import { createPageMetadata } from '@/lib/site/metadata';

export const metadata = createPageMetadata({
  title: 'Admin',
  description: 'Supereye administration.',
  noIndex: true,
});

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id || session.error === 'SessionInvalid') redirect('/login');
  if (session.user.status === 'suspended') redirect('/login?suspended=1');

  try {
    await requireAdminPanel(session.user.id);
  } catch {
    redirect('/workspace');
  }

  await ensureBillingSeed();

  return (
    <QueryProvider>
      <ActivityHeartbeat />
      <AdminShell userEmail={session.user.email} userRole={session.user.role}>
        {children}
      </AdminShell>
    </QueryProvider>
  );
}
