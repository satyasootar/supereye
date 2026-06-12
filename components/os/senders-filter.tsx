'use client';

import { useState, useMemo } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { User, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SendersFilterProps {
  emails: any[];
  currentQuery: string;
  onSelectSenders: (senders: string[]) => void;
  onClear: () => void;
}

export function SendersFilter({ emails, currentQuery, onSelectSenders, onClear }: SendersFilterProps) {
  const [open, setOpen] = useState(false);

  // Extract unique senders
  const senders = useMemo(() => {
    const map = new Map<string, { name: string, email: string }>();
    
    emails.forEach(email => {
      if (!email.sender) return;
      const match = email.sender.match(/(?:(.*)\s+)?<([^>]+)>/);
      let name = email.sender;
      let address = email.sender;
      if (match) {
        name = match[1] ? match[1].replace(/["']/g, '').trim() : match[2];
        address = match[2];
      } else {
        name = email.sender.replace(/[<>]/g, '').trim();
        address = name;
      }
      
      if (address && !map.has(address)) {
        map.set(address, { name, email: address });
      }
    });
    
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [emails]);

  const extractActiveSenders = (query: string): string[] => {
    // Match from:email avoiding trailing braces
    const matches = Array.from(query.matchAll(/from:([^\s}]+)/g));
    const active = new Set<string>();
    matches.forEach(m => {
        if (m[1]) active.add(m[1].trim());
    });
    return Array.from(active);
  };

  const activeSenders = extractActiveSenders(currentQuery);

  const toggleSender = (email: string) => {
    const newSenders = activeSenders.includes(email)
      ? activeSenders.filter(s => s !== email)
      : [...activeSenders, email];
    onSelectSenders(newSenders);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button 
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border-default hover:bg-bg-highlight text-[13px] font-medium transition-colors whitespace-nowrap",
            activeSenders.length > 0 ? "bg-accent-blue/10 text-accent-blue border-accent-blue/30" : "bg-bg-surface text-text-secondary"
          )}
        >
          <User className="h-3.5 w-3.5" />
          {activeSenders.length > 0 
            ? activeSenders.length === 1 
              ? `From: ${activeSenders[0]}` 
              : `From: ${activeSenders.length} senders`
            : 'Senders'}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 border-border-default shadow-xl rounded-xl" align="start">
        <Command>
          <CommandInput placeholder="From contains..." />
          <CommandList className="max-h-[300px]">
            <CommandEmpty>No senders found.</CommandEmpty>
            <CommandGroup>
              {senders.map((sender) => {
                const isSelected = activeSenders.includes(sender.email);
                return (
                  <CommandItem
                    key={sender.email}
                    value={`${sender.name} ${sender.email}`}
                    data-checked={isSelected}
                    onSelect={() => {
                      toggleSender(sender.email);
                      // Don't close popover so they can select multiple
                    }}
                    className="flex items-center gap-2 px-2 py-2 cursor-pointer group"
                  >
                    <div className="flex items-center justify-center h-4 w-4 border border-border-subtle rounded text-transparent group-data-[checked=true]:bg-accent-blue group-data-[checked=true]:text-white group-data-[checked=true]:border-accent-blue flex-shrink-0 transition-colors">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </div>
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-bg-elevated text-text-muted text-[10px] font-bold flex-shrink-0 ml-1">
                      {sender.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="truncate text-[13px] font-medium text-text-primary">{sender.name}</span>
                      {sender.name !== sender.email && (
                        <span className="truncate text-[11px] text-text-muted">{sender.email}</span>
                      )}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
          {activeSenders.length > 0 && (
            <div className="p-2 border-t border-border-subtle">
              <button 
                onClick={() => {
                  onClear();
                  setOpen(false);
                }}
                className="flex items-center gap-2 w-full px-2 py-1.5 text-[13px] text-text-secondary hover:text-text-primary hover:bg-bg-highlight rounded-md transition-colors"
              >
                <X className="h-4 w-4" />
                Clear filter
              </button>
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
