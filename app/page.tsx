import { LaserFlowBoxExample } from '@/components/ui/laser-flow-box';
import { LandingNavbar } from '@/components/landing/landing-navbar';
import { LandingBento } from '@/components/landing/landing-bento';
import { LandingHowItWorks } from '@/components/landing/landing-how-it-works';
import { LandingStats } from '@/components/landing/landing-stats';
import { LandingPricing } from '@/components/landing/landing-pricing';
import { LandingContact } from '@/components/landing/landing-contact';
import { LandingCta } from '@/components/landing/landing-cta';
import { LandingFooter } from '@/components/landing/landing-footer';

export default async function HomePage() {
  return (
    <div className="min-h-screen w-full bg-bg-app">
      {/* Hero + dashboard showcase — full bleed up to 1440px */}
      <div className="relative mx-auto w-full max-w-[1440px] min-w-0">
        <LandingNavbar />
        <LaserFlowBoxExample />
      </div>

      {/* Below-the-fold sections */}
      <LandingStats />
      <LandingBento />
      <LandingHowItWorks />
      <LandingPricing />
      <LandingContact />
      <LandingCta />
      <LandingFooter />
    </div>
  );
}
