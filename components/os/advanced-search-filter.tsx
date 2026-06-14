'use client';

import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SlidersHorizontal, Calendar as CalendarIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdvancedSearchFilterProps {
  currentQuery: string;
  onSearch: (query: string) => void;
}

export function AdvancedSearchFilter({ currentQuery, onSearch }: AdvancedSearchFilterProps) {
  const [open, setOpen] = useState(false);
  
  // Form state
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [includes, setIncludes] = useState('');
  const [excludes, setExcludes] = useState('');
  const [dateWithin, setDateWithin] = useState('1 day');
  const [hasAttachment, setHasAttachment] = useState(false);

  // Parse current query to populate if possible? (Optional, skipping for simplicity)
  // We'll just build a query string when they submit

  const handleSearch = () => {
    let q = '';
    
    if (from.trim()) q += `from:(${from.trim()}) `;
    if (to.trim()) q += `to:(${to.trim()}) `;
    if (subject.trim()) q += `subject:(${subject.trim()}) `;
    if (includes.trim()) q += `${includes.trim()} `;
    if (excludes.trim()) q += `-${excludes.trim().split(' ').join(' -')} `;
    if (hasAttachment) q += `has:attachment `;
    
    // We append date logic (simplified for now as just a visual placeholder, Gmail uses newer_than:1d etc.)
    if (dateWithin !== '1 day') {
        const daysMatch = dateWithin.match(/(\d+)\s*(day|week|month|year)/);
        if (daysMatch) {
            const num = daysMatch[1];
            const unit = daysMatch[2][0]; // d, w, m, y
            q += `newer_than:${num}${unit} `;
        }
    }

    onSearch(q.trim());
    setOpen(false);
  };

  const handleClear = () => {
    setFrom('');
    setTo('');
    setSubject('');
    setIncludes('');
    setExcludes('');
    setDateWithin('1 day');
    setHasAttachment(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button 
          className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-bg-highlight transition-colors"
          title="Show search options"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[500px] p-4 bg-bg-surface border-border-default shadow-xl rounded-xl" align="end">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">Advanced Search</h3>
            <button onClick={() => setOpen(false)} className="text-text-muted hover:text-text-primary">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-col gap-3 text-[13px]">
            <div className="grid grid-cols-[120px_1fr] items-center gap-2">
              <label className="text-text-secondary">From</label>
              <input 
                type="text" 
                value={from} onChange={e => setFrom(e.target.value)}
                className="bg-transparent border-b border-border-subtle focus:border-accent-blue outline-none py-1 text-text-primary"
              />
            </div>
            <div className="grid grid-cols-[120px_1fr] items-center gap-2">
              <label className="text-text-secondary">To</label>
              <input 
                type="text" 
                value={to} onChange={e => setTo(e.target.value)}
                className="bg-transparent border-b border-border-subtle focus:border-accent-blue outline-none py-1 text-text-primary"
              />
            </div>
            <div className="grid grid-cols-[120px_1fr] items-center gap-2">
              <label className="text-text-secondary">Subject</label>
              <input 
                type="text" 
                value={subject} onChange={e => setSubject(e.target.value)}
                className="bg-transparent border-b border-border-subtle focus:border-accent-blue outline-none py-1 text-text-primary"
              />
            </div>
            <div className="grid grid-cols-[120px_1fr] items-center gap-2">
              <label className="text-text-secondary">Includes the words</label>
              <input 
                type="text" 
                value={includes} onChange={e => setIncludes(e.target.value)}
                className="bg-transparent border-b border-border-subtle focus:border-accent-blue outline-none py-1 text-text-primary"
              />
            </div>
            <div className="grid grid-cols-[120px_1fr] items-center gap-2">
              <label className="text-text-secondary">Doesn't have</label>
              <input 
                type="text" 
                value={excludes} onChange={e => setExcludes(e.target.value)}
                className="bg-transparent border-b border-border-subtle focus:border-accent-blue outline-none py-1 text-text-primary"
              />
            </div>
            
            <div className="grid grid-cols-[120px_1fr] items-center gap-2 mt-2">
              <label className="text-text-secondary">Date within</label>
              <div className="flex items-center gap-2">
                <select 
                  value={dateWithin} onChange={e => setDateWithin(e.target.value)}
                  className="bg-transparent border-b border-border-subtle focus:border-accent-blue outline-none py-1 text-text-primary cursor-pointer w-[100px]"
                >
                  <option className="bg-bg-surface">1 day</option>
                  <option className="bg-bg-surface">1 week</option>
                  <option className="bg-bg-surface">1 month</option>
                  <option className="bg-bg-surface">6 months</option>
                  <option className="bg-bg-surface">1 year</option>
                </select>
                <div className="flex-1 flex items-center justify-end text-text-muted">
                    <CalendarIcon className="h-4 w-4" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-[120px_1fr] items-center gap-2 mt-2">
              <div />
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-text-secondary hover:text-text-primary">
                  <input type="checkbox" checked={hasAttachment} onChange={e => setHasAttachment(e.target.checked)} className="rounded border-border-subtle bg-transparent text-accent-blue focus:ring-accent-blue" />
                  Has attachment
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border-subtle">
              <button 
                onClick={handleClear}
                className="px-4 py-1.5 rounded-full text-[13px] font-medium text-text-secondary hover:text-text-primary hover:bg-bg-highlight transition-colors"
              >
                Clear filter
              </button>
              <button 
                onClick={handleSearch}
                className="px-6 py-1.5 rounded-full text-[13px] font-medium bg-accent-blue text-white hover:bg-accent-blue/90 transition-colors"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
