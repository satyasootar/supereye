'use client';

import { CalendarSidebar } from './calendar-sidebar';
import { CalendarGrid } from './calendar-grid';

export function CalendarPane() {
  return (
    <div className="flex h-full w-full overflow-hidden bg-bg-app">
      {/* 2-Column Layout for Calendar */}
      <CalendarSidebar />
      <CalendarGrid />
    </div>
  );
}
