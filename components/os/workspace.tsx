'use client';

import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils';
import { useState, useRef } from 'react';
import { EmailPane } from './email-pane';
import { EmailSidebar } from './email-sidebar';

import { useGlobalShortcuts } from '@/hooks/use-global-shortcuts';
import { useSSE } from '@/hooks/use-sse';
import { GlobalComposer } from './global-composer';
import { AiBot } from './ai-bot';
import { AgentOverlay } from './agent-overlay';

export function Workspace() {
  useGlobalShortcuts();
  useSSE();
  const { activeTabs, splitRatio, setSplitRatio } = useAppStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Map of available panes
  const panes = {
    email: <EmailPane key="email" />
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const newRatio = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    
    // Constrain to 20% - 80%
    if (newRatio >= 20 && newRatio <= 80) {
      setSplitRatio(newRatio);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  if (activeTabs.length === 0) return null;

  // Single Pane View
  if (activeTabs.length === 1) {
    return (
      <>
        <div className="flex h-full w-full bg-base overflow-hidden">
          <EmailSidebar />
          <div className="flex-1 min-w-0 h-full">
            {panes[activeTabs[0]]}
          </div>
        </div>
        <GlobalComposer />
        <AiBot />
        <AgentOverlay />
      </>
    );
  }

  // Split Pane View (2 panes max according to spec)
  const leftTab = activeTabs[0];
  const rightTab = activeTabs[1];

  return (
    <div 
      ref={containerRef}
      className="flex h-full w-full overflow-hidden"
    >
      <EmailSidebar />
      <div 
        className="h-full" 
        style={{ width: `${splitRatio}%` }}
      >
        {panes[leftTab]}
      </div>
      
      {/* Resizer Handle */}
      <div
        className={cn(
          "w-1 bg-border-subtle hover:bg-primary transition-colors cursor-col-resize z-10 flex-shrink-0 relative",
          isDragging && "bg-primary"
        )}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div className="absolute inset-y-0 -left-1 -right-1" /> {/* Larger hit area */}
      </div>

      <div 
        className="h-full" 
        style={{ width: `${100 - splitRatio}%` }}
      >
        {panes[rightTab]}
      </div>
      
      <GlobalComposer />
      <AiBot />
      <AgentOverlay />
    </div>
  );
}
