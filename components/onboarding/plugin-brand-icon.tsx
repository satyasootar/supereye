'use client';

import Image from 'next/image';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

const PLUGIN_ICON_SRC: Record<string, string | { light: string; dark: string }> = {
  email: '/Icons/gmail.svg',
  calendar: '/Icons/google-calendar.svg',
  github: {
    light: '/Icons/github/GitHub_light.svg',
    dark: '/Icons/github/GitHub_dark.svg',
  },
  drive: '/Icons/drive.svg',
};

export function PluginBrandIcon({
  pluginId,
  className,
  size = 28,
}: {
  pluginId: string;
  className?: string;
  size?: number;
}) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const entry = PLUGIN_ICON_SRC[pluginId];

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!entry) return null;

  const src =
    typeof entry === 'string'
      ? entry
      : (mounted && resolvedTheme === 'dark')
        ? entry.dark
        : entry.light;

  return (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      className={cn('object-contain', className)}
      aria-hidden
    />
  );
}
