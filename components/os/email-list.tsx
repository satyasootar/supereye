'use client';

import { 
  Menu, Filter, Paperclip, CheckSquare, Square, 
  Archive, Trash2, Clock, CheckCircle2, Tag 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const MOCK_EMAILS = [
  {
    id: 1,
    sender: 'Marie at Tally',
    subject: 'New formula editor in Tally',
    preview: 'The updates we\'re proudest of are often the ones that quietly remove friction...',
    time: '9:00 PM',
    unread: true,
    avatar: 'M',
    hasAttachment: false,
    priority: 'Medium',
    priorityColor: 'bg-yellow-500',
    group: 'Today'
  },
  {
    id: 2,
    sender: 'TCS Jobs',
    subject: 'AI certification job primer',
    preview: 'Your application for the AI engineer role has been received. Please complete the following...',
    time: '2:15 PM',
    unread: true,
    avatar: 'T',
    hasAttachment: true,
    priority: 'High',
    priorityColor: 'bg-orange-500',
    group: 'Today'
  },
  {
    id: 3,
    sender: 'DigitalOcean',
    subject: 'LLM cost routing architecture',
    preview: 'Learn how to route LLM requests efficiently across different providers to save up to 40%...',
    time: 'Yesterday',
    unread: false,
    avatar: 'D',
    hasAttachment: false,
    priority: 'Low',
    priorityColor: 'bg-gray-400',
    group: 'Yesterday'
  },
  {
    id: 4,
    sender: 'GitHub',
    subject: '[Corsair] Pull request approved',
    preview: 'Satya approved your pull request #42 (fix: memory leak in SSE connections)',
    time: 'Jun 10',
    unread: false,
    avatar: 'G',
    hasAttachment: false,
    priority: 'Medium',
    priorityColor: 'bg-yellow-500',
    group: 'Last 7 Days'
  }
];

export function EmailList() {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const groups = ['Today', 'Yesterday', 'Last 7 Days'];

  return (
    <div className="flex h-full w-[380px] flex-col border-r border-border-subtle bg-bg-base overflow-hidden flex-shrink-0">
      {/* Header Row */}
      <div className="flex h-12 flex-shrink-0 items-center justify-between px-4 border-b border-border-subtle bg-bg-surface">
        <span className="font-heading text-lg font-semibold text-text-primary">Inbox</span>
        <div className="flex items-center gap-1">
          <button className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-overlay rounded-md transition-colors">
            <Menu className="h-4 w-4" />
          </button>
          <button className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-overlay rounded-md transition-colors">
            <Filter className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filter Bar (Scrollable) */}
      <div className="flex items-center gap-2 px-3 py-2 overflow-x-auto no-scrollbar border-b border-border-subtle">
        <button className="flex-shrink-0 px-3 py-1 rounded-full bg-accent-blue text-white text-[12px] font-medium">All</button>
        <button className="flex-shrink-0 px-3 py-1 rounded-full bg-bg-overlay text-text-secondary hover:text-text-primary text-[12px] font-medium transition-colors">Unread</button>
        <button className="flex-shrink-0 px-3 py-1 rounded-full bg-bg-overlay text-text-secondary hover:text-text-primary text-[12px] font-medium transition-colors">Starred</button>
        <button className="flex-shrink-0 px-3 py-1 rounded-full bg-bg-overlay text-text-secondary hover:text-text-primary text-[12px] font-medium transition-colors">Attachments</button>
      </div>

      {/* Sort Control */}
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-border-subtle text-[11px] text-text-muted font-mono bg-bg-base z-10">
        <span>Sort: Newest ▾</span>
        <span>Density: Compact ▾</span>
      </div>

      {/* Email Rows */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative">
        {groups.map(group => {
          const emailsInGroup = MOCK_EMAILS.filter(e => e.group === group);
          if (emailsInGroup.length === 0) return null;

          return (
            <div key={group}>
              <div className="sticky top-0 z-10 bg-bg-base/95 backdrop-blur px-4 py-1 border-b border-border-subtle text-[11px] font-semibold tracking-wider text-text-muted uppercase">
                {group}
              </div>
              
              <div className="flex flex-col">
                {emailsInGroup.map(email => {
                  const isSelected = selectedIds.includes(email.id);
                  
                  return (
                    <div 
                      key={email.id}
                      className={cn(
                        "group relative flex flex-col gap-1 px-4 py-3 border-b border-border-subtle hover:bg-bg-overlay transition-colors cursor-pointer",
                        isSelected && "bg-bg-highlight border-l-2 border-l-accent-blue pl-[14px]",
                        !isSelected && email.unread && "bg-bg-surface/30"
                      )}
                    >
                      {/* Top Row: Unread Dot, Avatar, Sender, Time */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 overflow-hidden">
                          {/* Left area: Dot -> Checkbox on hover */}
                          <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center">
                            {isSelected ? (
                              <CheckSquare 
                                className="h-4 w-4 text-accent-blue" 
                                onClick={(e) => { e.stopPropagation(); toggleSelect(email.id); }} 
                              />
                            ) : (
                              <>
                                <div className={cn("h-1.5 w-1.5 rounded-full group-hover:hidden", email.unread ? "bg-accent-blue" : "bg-transparent")} />
                                <Square 
                                  className="h-4 w-4 text-text-muted hidden group-hover:block hover:text-text-primary" 
                                  onClick={(e) => { e.stopPropagation(); toggleSelect(email.id); }} 
                                />
                              </>
                            )}
                          </div>
                          
                          {/* Avatar */}
                          <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-bg-elevated border border-border-default text-[10px] font-bold text-text-primary">
                            {email.avatar}
                          </div>

                          <span className={cn("truncate text-[13.5px]", email.unread ? "font-semibold text-text-primary" : "font-medium text-text-secondary")}>
                            {email.sender}
                          </span>
                        </div>

                        {/* Right Area: Priority Badge, Attachment, Time */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {email.priority !== 'Low' && (
                            <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold uppercase text-white", email.priorityColor)}>
                              {email.priority}
                            </span>
                          )}
                          {email.hasAttachment && <Paperclip className="h-3 w-3 text-text-muted" />}
                          <span className="font-mono text-[11px] text-text-muted">{email.time}</span>
                        </div>
                      </div>

                      {/* Bottom Row: Subject & Preview */}
                      <div className="pl-9 pr-2">
                        <div className={cn("truncate text-[13.5px]", email.unread ? "font-semibold text-text-primary" : "font-medium text-text-primary")}>
                          {email.subject}
                        </div>
                        <div className="relative h-[20px] overflow-hidden">
                          {/* Default Preview Text */}
                          <div className="absolute inset-0 truncate text-[13px] text-text-secondary group-hover:opacity-0 transition-opacity">
                            {email.preview}
                          </div>
                          
                          {/* Hover Action Bar */}
                          <div className="absolute inset-0 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity translate-y-1 group-hover:translate-y-0 duration-200">
                            <button className="flex items-center gap-1 text-text-secondary hover:text-text-primary" title="Archive">
                              <Archive className="h-4 w-4" />
                            </button>
                            <button className="flex items-center gap-1 text-text-secondary hover:text-destructive" title="Delete">
                              <Trash2 className="h-4 w-4" />
                            </button>
                            <button className="flex items-center gap-1 text-text-secondary hover:text-text-primary" title="Snooze">
                              <Clock className="h-4 w-4" />
                            </button>
                            <button className="flex items-center gap-1 text-text-secondary hover:text-text-primary" title="Mark Read">
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                            <button className="flex items-center gap-1 text-text-secondary hover:text-text-primary" title="Label">
                              <Tag className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
