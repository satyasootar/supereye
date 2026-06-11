import { useState, KeyboardEvent } from 'react';
import { 
  CornerUpLeft, X, MoreHorizontal, ChevronDown,
  Sparkles, Paperclip, Calendar as CalendarIcon, Trash2, Code
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmailComposerProps {
  onClose: () => void;
  defaultTo: string;
}

function RecipientInput({ 
  recipients, 
  onChange, 
  placeholder 
}: { 
  recipients: string[], 
  onChange: (r: string[]) => void,
  placeholder?: string
}) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (['Enter', ' ', ','].includes(e.key)) {
      e.preventDefault();
      const val = inputValue.trim().replace(/,/g, '');
      if (val && !recipients.includes(val)) {
        onChange([...recipients, val]);
        setInputValue('');
      }
    } else if (e.key === 'Backspace' && !inputValue && recipients.length > 0) {
      onChange(recipients.slice(0, -1));
    }
  };

  const removeRecipient = (indexToRemove: number) => {
    onChange(recipients.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div className="flex items-center gap-2 flex-wrap flex-1">
      {recipients.map((recipient, idx) => (
        <div key={idx} className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-bg-overlay text-[14px] text-text-primary border border-border-subtle">
          <span>{recipient}</span>
          <button 
            type="button"
            aria-label="Remove recipient"
            onClick={() => removeRecipient(idx)}
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <input 
        type="text"
        aria-label="Recipient email address"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={recipients.length === 0 ? placeholder : ""}
        className="flex-1 min-w-[120px] bg-transparent text-[14px] text-text-primary placeholder:text-text-muted outline-none"
      />
    </div>
  );
}

export function EmailComposer({ onClose, defaultTo }: EmailComposerProps) {
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [toRecipients, setToRecipients] = useState<string[]>([defaultTo]);
  const [ccRecipients, setCcRecipients] = useState<string[]>([]);
  const [bccRecipients, setBccRecipients] = useState<string[]>([]);

  return (
    <div className="flex flex-col rounded-2xl bg-bg-elevated border border-border-subtle text-text-primary shadow-lg overflow-hidden mt-4 mb-8">
      
      {/* Top Bar */}
      <div className="flex items-start justify-between px-6 py-5 min-h-[64px]">
        <div className="flex items-start gap-4 flex-1 mt-1">
          <button type="button" aria-label="Go back" className="text-text-muted hover:text-text-primary transition-colors flex-shrink-0 mt-1.5">
            <CornerUpLeft className="h-5 w-5" />
          </button>
          
          <RecipientInput 
            recipients={toRecipients} 
            onChange={setToRecipients} 
            placeholder="Add recipient" 
          />
        </div>
        
        <div className="flex items-center gap-5 text-[14px] text-text-muted flex-shrink-0 ml-4 mt-2">
          <button 
            type="button"
            onClick={() => setShowCcBcc(!showCcBcc)}
            className="hover:text-text-primary transition-colors font-medium"
          >
            Cc / Bcc
          </button>
          <button type="button" aria-label="More options" className="hover:text-text-primary transition-colors">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Cc / Bcc Expanded Rows */}
      {showCcBcc && (
        <div className="flex flex-col px-6 pb-2">
          <div className="flex items-center gap-4 py-2 min-h-[40px]">
            <span className="text-[14px] text-text-muted w-8 flex-shrink-0 font-medium">Cc</span>
            <RecipientInput 
              recipients={ccRecipients} 
              onChange={setCcRecipients} 
              placeholder="Add recipient" 
            />
          </div>
          <div className="flex items-center gap-4 py-2 min-h-[40px]">
            <span className="text-[14px] text-text-muted w-8 flex-shrink-0 font-medium">Bcc</span>
            <RecipientInput 
              recipients={bccRecipients} 
              onChange={setBccRecipients} 
              placeholder="Add recipient" 
            />
          </div>
        </div>
      )}

      {/* Editor Area */}
      <div className="relative px-6 py-2">
        <textarea 
          aria-label="Email body"
          autoFocus
          placeholder='Write, or press "space" for AI, "/" for commands...'
          className="w-full min-h-[250px] bg-transparent resize-none outline-none text-[15px] text-text-primary placeholder:text-text-muted leading-relaxed"
        />
      </div>

      {/* Bottom Toolbar */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-stretch shadow-sm rounded-lg overflow-hidden">
          <button type="button" className="flex items-center gap-2 px-6 py-2 bg-accent-blue hover:bg-accent-blue-dim text-white text-[15px] font-medium transition-colors">
            Send
          </button>
          <div className="w-[1px] bg-white/20"></div>
          <button type="button" aria-label="Send options" className="flex items-center justify-center px-3 py-2 bg-accent-blue hover:bg-accent-blue-dim text-white transition-colors">
            <ChevronDown className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex items-center gap-4 text-text-muted">
          <button type="button" aria-label="AI Assistant" className="hover:text-text-primary transition-colors">
            <Sparkles className="h-5 w-5" />
          </button>
          <button type="button" aria-label="Attach file" className="hover:text-text-primary transition-colors">
            <Paperclip className="h-5 w-5" />
          </button>
          <button type="button" aria-label="Insert code" className="hover:text-text-primary transition-colors">
            <Code className="h-5 w-5" />
          </button>
          <button type="button" aria-label="Insert calendar event" className="hover:text-text-primary transition-colors">
            <CalendarIcon className="h-5 w-5" />
          </button>
          <button 
            type="button"
            aria-label="Discard draft"
            onClick={onClose}
            className="hover:text-text-primary transition-colors ml-2"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>

    </div>
  );
}
