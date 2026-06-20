'use client';

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type ProfileSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function ProfileSection({ title, description, children, className }: ProfileSectionProps) {
  return (
    <section
      className={cn(
        'rounded-[var(--radius)] border border-border-default bg-bg-elevated shadow-sm',
        className
      )}
    >
      <div className="border-b border-border-subtle px-6 py-5">
        <h2 className="text-[15px] font-semibold text-text-primary">{title}</h2>
        {description && (
          <p className="mt-1 text-[13px] leading-relaxed text-text-muted">{description}</p>
        )}
      </div>
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}

type ProfileRowProps = {
  label: string;
  description?: string;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
};

export function ProfileRow({ label, description, children, className, icon }: ProfileRowProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 border-b border-border-subtle py-4 last:border-b-0 last:pb-0 first:pt-0 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3.5">
        {icon && <div className="mt-0.5 shrink-0">{icon}</div>}
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-text-primary">{label}</p>
          {description && (
            <p className="mt-0.5 text-[12px] text-text-muted">{description}</p>
          )}
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
