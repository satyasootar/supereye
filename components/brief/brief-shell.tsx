'use client';

import { BriefDashboard } from '@/components/brief/brief-dashboard';
import { GlobalComposer } from '@/components/os/global-composer';
import { AiBot } from '@/components/os/ai-bot';
import { AgentOverlay } from '@/components/os/agent-overlay';

export function BriefShell() {
  return (
    <>
      <div className="flex h-full min-h-0 w-full overflow-hidden bg-base">
        <BriefDashboard />
      </div>
      <GlobalComposer />
      <AiBot />
      <AgentOverlay />
    </>
  );
}
