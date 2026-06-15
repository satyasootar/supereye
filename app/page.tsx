import { LaserFlowBoxExample } from '@/components/ui/laser-flow-box';
import { LandingNavbar } from '@/components/landing/landing-navbar';

export default async function HomePage() {
  return (
    <div className="min-h-screen bg-bg-app w-full flex flex-col items-center overflow-x-auto">
      <div className="w-full max-w-[1440px] min-w-[1200px] relative flex flex-col">
        <LandingNavbar />
        <LaserFlowBoxExample />
      </div>
    </div>
  );
}
