'use client';

import { EmailSidebar } from './email-sidebar';
import { EmailReader } from './email-reader';
import { EmailListFull } from './email-list-full';
import { CalendarSidebar } from './calendar-sidebar';
import { useAppStore } from '@/lib/store/app-store';
import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight, ChevronLeft, Calendar } from 'lucide-react';
import { CalendarModal } from './calendar-modal';

export function EmailPane() {
  const { selectedEmailId } = useAppStore();
  const [splitRatio, setSplitRatio] = useState(50); // The left list takes 50%, reader takes 50%
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(true);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    
    // Prevent text selection while dragging
    document.body.style.userSelect = 'none';
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current || !overlayRef.current || !listRef.current) return;
    
    const splitContainer = containerRef.current;
    const rect = splitContainer.getBoundingClientRect();
    const newRatio = ((e.clientX - rect.left) / rect.width) * 100;
    
    // Constrain the divider to 20% - 80%
    if (newRatio >= 20 && newRatio <= 80) {
      // Directly mutate the DOM to bypass React render cycle for buttery smooth 60fps drag
      listRef.current.style.width = `${newRatio}%`;
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
      
      <div className="flex-1 flex overflow-hidden" ref={containerRef}>
        {/* Email List */}
        <div 
          ref={listRef}
          className="h-full overflow-hidden flex-shrink-0"
          style={{ width: selectedEmailId ? `${splitRatio}%` : '100%' }}
        >
          <EmailListFull />
        </div>

        {/* Reader */}
        {selectedEmailId && (
          <div 
            ref={overlayRef}
            className="flex h-full border-l border-border-strong relative animate-in slide-in-from-right-8 duration-200"
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

      {/* Calendar right panel */}
      {isCalendarOpen ? (
        <div className="relative w-[260px] flex-shrink-0 border-l border-border-strong bg-bg-surface animate-in slide-in-from-right-8 duration-200">
          <button 
            onClick={() => setIsCalendarOpen(false)}
            className="absolute -left-3 top-4 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-border-subtle bg-bg-surface text-text-muted hover:text-text-primary shadow-sm hover:bg-bg-highlight"
            title="Close Calendar"
          >
            <ChevronRight className="h-3 w-3" />
          </button>
          <CalendarSidebar variant="right-panel" />
        </div>
      ) : (
        <div 
          className="relative w-8 flex-shrink-0 bg-bg-surface border-l border-border-strong group flex flex-col items-center py-4"
        >
          {/* Active Accent Bar */}
          <div className="absolute inset-y-0 left-0 w-[2px] bg-transparent hover:bg-accent-blue transition-colors cursor-pointer" onClick={() => setIsCalendarOpen(true)} />
          
          {/* Icon -> Opens Modal */}
          <CalendarModal trigger={
            <button title="Full Calendar" className="flex h-6 w-6 items-center justify-center rounded-md text-text-muted hover:text-accent-blue hover:bg-accent-blue/10 transition-colors mt-2">
              <Calendar className="h-4 w-4" />
            </button>
          } />
        </div>
      )}
    </div>
  );
}
