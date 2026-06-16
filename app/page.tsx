import { LaserFlowBoxExample } from '@/components/ui/laser-flow-box';
import { LandingNavbar } from '@/components/landing/landing-navbar';
import { LandingBento } from '@/components/landing/landing-bento';
import { LandingPricing } from '@/components/landing/landing-pricing';
import { LandingFaq } from '@/components/landing/landing-faq';
import { LandingCta } from '@/components/landing/landing-cta';
import { LandingFooter } from '@/components/landing/landing-footer';
import { JsonLd } from '@/components/seo/json-ld';
import { createPageMetadata } from '@/lib/site/metadata';
import { homePageJsonLd } from '@/lib/site/structured-data';

export const metadata = createPageMetadata({
  title: 'Unified inbox & daily command center',
  path: '/',
});

export default async function HomePage() {
  return (
    <div className="min-h-screen w-full bg-bg-app">
      <JsonLd data={homePageJsonLd()} />
      <main>
      {/* Hero + dashboard showcase — full bleed up to 1440px */}
      <div className="relative mx-auto w-full max-w-[1440px] min-w-0">
        <LandingNavbar />
        <LaserFlowBoxExample />
      </div>

      {/* Below-the-fold sections */}
      <LandingBento />
      <LandingPricing />
      <LandingFaq />
      <LandingCta />
      <LandingFooter />
      </main>
    </div>
  );
}
