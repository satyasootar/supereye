import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getUserPreferences } from '@/lib/user/preferences';
import { ensureDefaultWorkspaces } from '@/lib/workspaces/workspaces';
import { Workspace } from '@/components/os/workspace';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const prefs = await getUserPreferences(session.user.id);

  if (!prefs.onboardingCompleted) {
    redirect('/workspace/onboarding');
  }

  await ensureDefaultWorkspaces(session.user.id);

  return <Workspace />;
}
