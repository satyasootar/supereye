import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/billing/rbac';
import { ensureBillingSeed } from '@/lib/billing/seed';
import { AdminShell } from '@/components/admin/admin-shell';
import { QueryProvider } from '@/components/providers/query-provider';

export const metadata = {
  title: 'Admin — Supereye',
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  try {
    await requireAdmin(session.user.id);
  } catch {
    redirect('/workspace');
  }

  await ensureBillingSeed();

  return (
    <QueryProvider>
      <AdminShell userEmail={session.user.email}>{children}</AdminShell>
    </QueryProvider>
  );
}
