'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

export type Attendee = {
  email: string;
  name?: string;
};

type ContactSuggestion = {
  email: string;
  name: string;
  source: 'email' | 'calendar';
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type AttendeePickerProps = {
  value: Attendee[];
  onChange: (attendees: Attendee[]) => void;
};

export function AttendeePicker({ value, onChange }: AttendeePickerProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['calendar', 'contacts', query],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      const res = await fetch(`/api/calendar/contacts?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load contacts');
      return res.json() as Promise<{ contacts: ContactSuggestion[] }>;
    },
    staleTime: 60_000,
  });

  const suggestions = useMemo(() => {
    const selected = new Set(value.map((a) => a.email.toLowerCase()));
    return (data?.contacts ?? []).filter((c) => !selected.has(c.email));
  }, [data?.contacts, value]);

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const addAttendee = (email: string, name?: string) => {
    const normalized = email.trim().toLowerCase();
    if (!EMAIL_RE.test(normalized)) return;
    if (value.some((a) => a.email.toLowerCase() === normalized)) return;
    onChange([...value, { email: normalized, name: name?.trim() || normalized }]);
    setQuery('');
    setOpen(false);
  };

  const removeAttendee = (email: string) => {
    onChange(value.filter((a) => a.email !== email));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions[0]) {
        addAttendee(suggestions[0].email, suggestions[0].name);
      } else if (EMAIL_RE.test(query.trim())) {
        addAttendee(query.trim());
      }
    } else if (e.key === 'Backspace' && !query && value.length > 0) {
      removeAttendee(value[value.length - 1].email);
    }
  };

  return (
    <div ref={containerRef} className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((attendee) => (
            <span
              key={attendee.email}
              className="inline-flex items-center gap-1.5 rounded-md border border-border-default bg-bg-overlay px-2.5 py-1 text-[12px] text-text-primary"
            >
              <span className="max-w-[180px] truncate">
                {attendee.name && attendee.name !== attendee.email
                  ? `${attendee.name} · ${attendee.email}`
                  : attendee.email}
              </span>
              <button
                type="button"
                onClick={() => removeAttendee(attendee.email)}
                className="rounded-sm text-text-muted transition-colors hover:text-text-primary"
                aria-label={`Remove ${attendee.email}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <UserPlus className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Add guests by email…"
          className="h-10 rounded-md border-border-default bg-bg-overlay pl-9 text-text-primary placeholder:text-text-muted"
        />

        {open && (suggestions.length > 0 || isLoading) && (
          <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-border-default bg-bg-elevated py-1 shadow-xl custom-scrollbar">
            {isLoading && (
              <p className="px-3 py-2 text-[12px] text-text-muted">Loading suggestions…</p>
            )}
            {suggestions.map((contact) => (
              <button
                key={contact.email}
                type="button"
                onClick={() => addAttendee(contact.email, contact.name)}
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-[13px] transition-colors hover:bg-bg-overlay"
              >
                <span className="min-w-0 truncate text-text-primary">{contact.name}</span>
                <span className="shrink-0 truncate text-[12px] text-text-muted">
                  {contact.email}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {!query && value.length === 0 && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.slice(0, 4).map((contact) => (
            <button
              key={contact.email}
              type="button"
              onClick={() => addAttendee(contact.email, contact.name)}
              className="rounded-md border border-border-subtle bg-bg-surface px-2 py-1 text-[11px] text-text-secondary transition-colors hover:border-border-default hover:text-text-primary"
            >
              {contact.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
