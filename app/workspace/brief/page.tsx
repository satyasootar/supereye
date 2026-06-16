import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getUserPreferences } from '@/lib/user/preferences';
import { ensureDefaultWorkspaces } from '@/lib/workspaces/workspaces';
import { BriefShell } from '@/components/brief/brief-shell';
import { createPageMetadata } from '@/lib/site/metadata';

export const metadata = createPageMetadata({
  title: 'Today',
  description: 'Your AI daily command center — urgent mail, meetings, OTPs, and what to do next.',
  noIndex: true,
});

export default async function BriefPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const prefs = await getUserPreferences(session.user.id);
  if (!prefs.onboardingCompleted) redirect('/workspace/onboarding');

  await ensureDefaultWorkspaces(session.user.id);

  return <BriefShell />;
}
