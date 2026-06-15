'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { LandingSection } from './landing-section';

const STATS = [
  { value: '<2s', label: 'Average action time' },
  { value: '50+', label: 'Keyboard shortcuts' },
  { value: 'Real-time', label: 'Gmail & Calendar sync' },
  { value: '1-click', label: 'Email to calendar' },
];

export function LandingStats() {
  const reduceMotion = useReducedMotion();

  return (
    <LandingSection className="border-y border-border-subtle bg-bg-elevated py-12 md:py-14">
      <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-6">
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            className="text-center md:text-left"
          >
            <p className="font-heading text-2xl font-bold tracking-tight text-accent-blue md:text-3xl">
              {stat.value}
            </p>
            <p className="mt-1 text-[13px] text-text-muted">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </LandingSection>
  );
}
