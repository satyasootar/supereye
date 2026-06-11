'use client';

import { EmailSidebar } from './email-sidebar';
import { EmailList } from './email-list';
import { EmailReader } from './email-reader';

export function EmailPane() {
  return (
    <div className="flex h-full w-full overflow-hidden bg-bg-app">
      {/* 3-Column Layout for Email */}
      <EmailSidebar />
      <EmailList />
      <EmailReader />
    </div>
  );
}
