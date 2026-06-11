'use client';

import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';

// Placeholder components for the 3 main views
function ChatPane() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-base">
      <div className="text-center">
        <h2 className="text-2xl font-heading text-primary mb-2">AI Chat</h2>
        <p className="text-muted-foreground">Corsair Agent Canvas</p>
      </div>
    </div>
  );
}

function EmailPane() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-surface">
      <div className="text-center">
        <h2 className="text-2xl font-heading text-primary mb-2">Email</h2>
        <p className="text-muted-foreground">Superhuman-style Inbox</p>
      </div>
    </div>
  );
}

function CalendarPane() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-base">
      <div className="text-center">
        <h2 className="text-2xl font-heading text-primary mb-2">Calendar</h2>
        <p className="text-muted-foreground">Schedule & Events</p>
      </div>
    </div>
  );
}

export function Workspace() {
  const { activeTabs, splitRatio, setSplitRatio } = useAppStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Map of available panes
  const panes = {
    chat: <ChatPane key="chat" />,
    email: <EmailPane key="email" />,
    calendar: <CalendarPane key="calendar" />
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
      <div className="h-full w-full bg-base">
        {panes[activeTabs[0]]}
      </div>
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
    </div>
  );
}
