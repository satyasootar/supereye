import { auth } from '@/lib/auth';
import { LandingPage } from '@/components/landing/landing-page';

export default async function HomePage() {
  const session = await auth();
  const isLoggedIn = !!session?.user?.id;

  return <LandingPage isLoggedIn={isLoggedIn} />;
}
