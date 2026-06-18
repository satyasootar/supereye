import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getUserPreferences } from '@/lib/user/preferences';
import { OnboardingPageClient } from '@/components/onboarding/onboarding-page';
import { isDemoAccountEmail } from '@/lib/auth/demo-account';

export const metadata = {
  title: 'Onboarding — Supereye',
};

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const prefs = await getUserPreferences(session.user.id);
  if (prefs.onboardingCompleted) redirect('/workspace');

  const isDemoAccount = isDemoAccountEmail(session.user.email);

  return (
    <Suspense fallback={null}>
      <OnboardingPageClient isDemoAccount={isDemoAccount} />
    </Suspense>
  );
}
