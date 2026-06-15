'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LandingSection } from './landing-section';

export function LandingCta() {
  const reduceMotion = useReducedMotion();

  return (
    <LandingSection className="py-16 md:py-20">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--accent-blue)_30%,transparent)] bg-bg-elevated px-8 py-14 text-center md:px-16 md:py-16"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 80% at 50% 100%, color-mix(in srgb, var(--accent-blue) 14%, transparent), transparent 65%)',
          }}
        />

        <div className="relative">
          <h2 className="font-heading text-3xl font-semibold tracking-tight text-text-primary md:text-4xl">
            Ready to see your whole day?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base text-text-secondary">
            Join power users who run their entire workday from one intelligent workspace. Free to start — no credit card required.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="gap-2 px-8">
              <Link href="/login">
                Get started for free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="#features">Explore features</Link>
            </Button>
          </div>
        </div>
      </motion.div>
    </LandingSection>
  );
}
