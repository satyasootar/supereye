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

  const normalizedQuery = query.trim().toLowerCase();
  const canAddQuery = EMAIL_RE.test(normalizedQuery);
  const queryAlreadySelected =
    canAddQuery && value.some((a) => a.email.toLowerCase() === normalizedQuery);

  const addAttendee = (email: string, name?: string) => {
    const normalized = email.trim().toLowerCase();
    if (!EMAIL_RE.test(normalized)) return;
    if (value.some((a) => a.email.toLowerCase() === normalized)) return;
    onChange([...value, { email: normalized, name: name?.trim() || normalized }]);
    setQuery('');
    setOpen(false);
  };

  const addFromQuery = () => {
    if (canAddQuery && !queryAlreadySelected) {
      addAttendee(normalizedQuery);
      return true;
    }
    return false;
  };

  const removeAttendee = (email: string) => {
    onChange(value.filter((a) => a.email !== email));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (addFromQuery()) return;
      if (suggestions[0]) {
        addAttendee(suggestions[0].email, suggestions[0].name);
      }
    } else if (e.key === 'Tab' && query.trim()) {
      if (addFromQuery()) {
        e.preventDefault();
      }
    } else if (e.key === 'Backspace' && !query && value.length > 0) {
      removeAttendee(value[value.length - 1].email);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text');
    const emails = pasted
      .split(/[,;\s]+/)
      .map((part) => part.trim().toLowerCase())
      .filter((part) => EMAIL_RE.test(part));

    if (emails.length === 0) return;

    e.preventDefault();
    const next = [...value];
    const seen = new Set(next.map((a) => a.email.toLowerCase()));
    for (const email of emails) {
      if (!seen.has(email)) {
        seen.add(email);
        next.push({ email, name: email });
      }
    }
    onChange(next);
    setQuery('');
    setOpen(false);
  };

  const showDropdown =
    open && (isLoading || suggestions.length > 0 || (canAddQuery && !queryAlreadySelected));

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
          onPaste={handlePaste}
          placeholder="Add guests by email…"
          className="h-10 rounded-md border-border-default bg-bg-overlay pl-9 text-text-primary placeholder:text-text-muted"
        />

        {showDropdown && (
          <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-border-default bg-bg-elevated py-1 shadow-xl custom-scrollbar">
            {isLoading && (
              <p className="px-3 py-2 text-[12px] text-text-muted">Loading suggestions…</p>
            )}
            {canAddQuery && !queryAlreadySelected && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => addAttendee(normalizedQuery)}
                className="flex w-full items-center gap-2 border-b border-border-subtle px-3 py-2 text-left text-[13px] transition-colors hover:bg-bg-overlay"
              >
                <UserPlus className="h-3.5 w-3.5 shrink-0 text-accent-blue" />
                <span className="text-text-primary">
                  Add <span className="font-medium">{normalizedQuery}</span>
                </span>
              </button>
            )}
            {suggestions.map((contact) => (
              <button
                key={contact.email}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
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
