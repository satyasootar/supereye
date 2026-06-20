'use client';

import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export function WalletUsageRefreshButton({
  onClick,
  isFetching,
  className,
  size = 'sm',
}: {
  onClick: () => void;
  isFetching?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}) {
  const iconClass = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  const buttonClass =
    size === 'sm' ? 'h-6 w-6' : 'h-8 w-8';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isFetching}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-md text-text-muted transition-colors',
        'hover:bg-bg-overlay hover:text-text-primary disabled:opacity-60',
        buttonClass,
        className
      )}
      aria-label="Refresh credit usage"
      title="Refresh credit usage"
    >
      <RefreshCw className={cn(iconClass, isFetching && 'animate-spin')} />
    </button>
  );
}
