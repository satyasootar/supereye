'use client';

import { LandingNavbar } from './landing-navbar';
import { LandingHero } from './landing-hero';
import { LandingWorkspaceDemo } from './landing-workspace-demo';
import { LandingFeatures } from './landing-features';
import { LandingHowItWorks } from './landing-how-it-works';
import { LandingIntegrations } from './landing-integrations';
import { LandingTestimonials } from './landing-testimonials';
import { LandingCta, LandingFooter } from './landing-cta-footer';

export function LandingPage({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <div className="landing-grain relative min-h-screen overflow-x-hidden bg-bg-app text-text-primary">
      {/* Ambient depth */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-[20%] -top-[10%] h-[50%] w-[50%] rounded-full bg-accent-blue-glow blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[20%] h-[40%] w-[40%] rounded-full bg-accent-blue-glow blur-[100px]" />
      </div>

      <div className="relative z-10">
        <LandingNavbar isLoggedIn={isLoggedIn} />
        <LandingHero isLoggedIn={isLoggedIn} />
        <LandingWorkspaceDemo />
        <LandingFeatures />
        <LandingHowItWorks />
        <LandingIntegrations />
        <LandingTestimonials />
        <LandingCta isLoggedIn={isLoggedIn} />
        <LandingFooter />
      </div>
    </div>
  );
}
