'use client';

import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CalendarGrid } from './calendar-grid';
import { CalendarSidebar } from './calendar-sidebar';
import { Maximize2, Calendar } from 'lucide-react';
import { ReactNode } from 'react';

interface CalendarModalProps {
  children?: ReactNode;
  trigger?: ReactNode;
}

export function CalendarModal({ children, trigger }: CalendarModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <button className="flex items-center gap-2 p-2 hover:bg-bg-overlay rounded-md text-text-secondary hover:text-text-primary transition-colors w-full">
            <Maximize2 className="h-4 w-4" />
            <span className="text-[13px] font-medium">Open Full Calendar</span>
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-[95vw] md:max-w-[90vw] lg:max-w-[1400px] w-full h-[90vh] p-0 overflow-hidden border-border-strong bg-bg-app rounded-xl shadow-2xl flex [&_[data-slot=dialog-close]]:top-3">
        <DialogTitle className="sr-only">Full Calendar View</DialogTitle>
        <div className="w-[260px] border-r border-border-subtle bg-bg-surface flex-shrink-0 hidden md:flex flex-col">
          <div className="flex h-14 flex-shrink-0 items-center px-4 border-b border-border-subtle bg-bg-surface">
            <Calendar className="h-4 w-4 text-accent-blue mr-2" />
            <span className="text-[14px] font-bold text-text-primary">Calendar</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <CalendarSidebar variant="modal" forceExpanded={true} />
          </div>
        </div>
        <div className="flex-1 h-full overflow-hidden">
          <CalendarGrid isModal={true} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
