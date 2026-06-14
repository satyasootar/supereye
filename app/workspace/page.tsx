import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Workspace } from '@/components/os/workspace';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  return <Workspace />;
}
