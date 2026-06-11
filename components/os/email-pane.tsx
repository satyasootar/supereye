'use client';

import { EmailSidebar } from './email-sidebar';
import { EmailReader } from './email-reader';
import { EmailListFull } from './email-list-full';
import { useAppStore } from '@/lib/store/app-store';
import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';

export function EmailPane() {
  const { selectedEmailId } = useAppStore();
  const [splitRatio, setSplitRatio] = useState(50); // The left list takes 50%, reader takes 50%
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    
    // Prevent text selection while dragging
    document.body.style.userSelect = 'none';
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current || !overlayRef.current) return;
    
    const splitContainer = containerRef.current;
    const rect = splitContainer.getBoundingClientRect();
    const newRatio = ((e.clientX - rect.left) / rect.width) * 100;
    
    // Constrain the divider to 20% - 80%
    if (newRatio >= 20 && newRatio <= 80) {
      // Directly mutate the DOM to bypass React render cycle for buttery smooth 60fps drag
      overlayRef.current.style.width = `${100 - newRatio}%`;
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
    document.body.style.userSelect = '';
    
    // Sync the final position to React state so it persists
    if (containerRef.current) {
      const splitContainer = containerRef.current;
      const rect = splitContainer.getBoundingClientRect();
      const newRatio = ((e.clientX - rect.left) / rect.width) * 100;
      if (newRatio >= 20 && newRatio <= 80) {
        setSplitRatio(newRatio);
      }
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-bg-app">
      <EmailSidebar />
      
      <div className="flex-1 relative overflow-hidden" ref={containerRef}>
        {/* Email List - Always Full Width */}
        <div className="absolute inset-0 z-0">
          <EmailListFull />
        </div>

        {/* Reader Overlay (z-50) */}
        {selectedEmailId && (
          <div 
            ref={overlayRef}
            className="absolute top-0 bottom-0 right-0 z-50 flex shadow-2xl border-l border-border-strong bg-bg-app animate-in slide-in-from-right-8 duration-200"
            style={{ width: `${100 - splitRatio}%` }}
          >
            {/* Resizer Handle */}
            <div
              className={cn(
                "w-1.5 absolute left-0 top-0 bottom-0 -ml-[3px] bg-transparent hover:bg-accent-blue transition-colors cursor-col-resize z-50",
                isDragging && "bg-accent-blue"
              )}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            />
            
            <div className="flex-1 h-full overflow-hidden">
              <EmailReader />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
