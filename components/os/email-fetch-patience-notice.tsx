'use client';

import { Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

export function EmailFetchPatienceNotice({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'mx-auto flex max-w-md flex-col items-center gap-3 rounded-lg border border-border-subtle bg-bg-elevated/80 px-6 py-8 text-center',
        className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-blue/10 text-accent-blue">
        <Inbox className="h-6 w-6" />
      </div>
      <div className="space-y-1.5">
        <p className="text-[15px] font-medium text-text-primary">
          We are fetching your emails
        </p>
        <p className="text-[13px] leading-relaxed text-text-muted">
          Please have some patience. You can explore other sections while we fetch.
        </p>
      </div>
    </div>
  );
}
