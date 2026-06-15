'use client';

import { ThemeProvider } from '@/components/theme-provider';
import { SessionProvider } from 'next-auth/react';
import { MotionConfig } from 'framer-motion';
import { QueryProvider } from '@/components/providers/query-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <QueryProvider>
        <ThemeProvider>
          <MotionConfig reducedMotion="user">
            {children}
          </MotionConfig>
        </ThemeProvider>
      </QueryProvider>
    </SessionProvider>
  );
}
