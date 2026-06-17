'use client';

import { AiBot } from '@/components/os/ai-bot';

type AuthHeaderProps = {
  title: string;
};

export function AuthHeader({ title }: AuthHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center">
        <AiBot
          openAgentOnClick={false}
          hideWhenAgentOpen={false}
          disableClick
          size="sm"
          className="!relative !z-0"
        />
      </div>
      <div>
        <p className="text-sm font-medium text-text-secondary">Supereye</p>
        <h1 className="font-heading text-2xl font-semibold text-text-primary">{title}</h1>
      </div>
    </div>
  );
}
