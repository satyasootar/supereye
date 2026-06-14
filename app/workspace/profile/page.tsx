import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getUserProfile } from '@/lib/user/profile';
import { ProfilePageClient } from '@/components/profile/profile-page';

export const metadata = {
  title: 'Profile — Supereye',
  description: 'Manage your account, connections, and preferences.',
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const profile = await getUserProfile(session.user.id);
  if (!profile) {
    redirect('/login');
  }

  return (
    <Suspense>
      <ProfilePageClient profile={profile} />
    </Suspense>
  );
}
