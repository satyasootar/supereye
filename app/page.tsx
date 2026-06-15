import { LaserFlowBoxExample } from '@/components/ui/laser-flow-box';
import { LandingNavbar } from '@/components/landing/landing-navbar';

export default async function HomePage() {
  return (
    <div className="min-h-screen bg-bg-app w-full">
      <LandingNavbar />
      <LaserFlowBoxExample />
    </div>
  );
}
