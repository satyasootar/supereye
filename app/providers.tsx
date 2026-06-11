'use client';

import { ThemeProvider } from '@/components/theme-provider';
import { SessionProvider } from 'next-auth/react';
import { MotionConfig } from 'framer-motion';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <MotionConfig reducedMotion="user">
          {children}
        </MotionConfig>
      </ThemeProvider>
    </SessionProvider>
  );
}
