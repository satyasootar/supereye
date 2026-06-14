'use client';

import Image from 'next/image';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

const PLUGIN_ICON_SRC: Record<string, string | { light: string; dark: string }> = {
  email: '/Icons/gmail.svg',
  calendar: '/Icons/google-calendar.svg',
  github: {
    light: '/Icons/github/GitHub_light.svg',
    dark: '/Icons/github/GitHub_dark.svg',
  },
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
  const entry = PLUGIN_ICON_SRC[pluginId];

  if (!entry) return null;

  const src =
    typeof entry === 'string'
      ? entry
      : resolvedTheme === 'dark'
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
