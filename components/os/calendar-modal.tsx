'use client';

import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { CalendarGrid } from './calendar-grid';
import { useAppStore } from '@/lib/store/app-store';
import { Maximize2 } from 'lucide-react';
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
      <DialogContent className="max-w-[95vw] w-[1400px] h-[90vh] p-0 overflow-hidden border-border-strong bg-bg-app rounded-xl shadow-2xl">
        <CalendarGrid />
      </DialogContent>
    </Dialog>
  );
}
