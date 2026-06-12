import { useState, useRef, KeyboardEvent } from 'react';
import { addDays, setHours, setMinutes, nextFriday, format } from 'date-fns';
import { 
  CornerUpLeft, X, MoreHorizontal, ChevronDown,
  Sparkles, Paperclip, Calendar as CalendarIcon, Trash2, Code
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { toast } from 'sonner';

interface EmailComposerProps {
  onClose: () => void;
  defaultTo: string;
  emailId: string;
  threadId?: string;
  subject?: string;
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

export function EmailComposer({ onClose, defaultTo, emailId, threadId, subject }: EmailComposerProps) {
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [showScheduleSend, setShowScheduleSend] = useState(false);
  const [toRecipients, setToRecipients] = useState<string[]>([defaultTo]);
  const [ccRecipients, setCcRecipients] = useState<string[]>([]);
  const [bccRecipients, setBccRecipients] = useState<string[]>([]);
  const [bodyText, setBodyText] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [scheduleAt, setScheduleAt] = useState<Date | null>(null);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate dynamic schedule times
  const now = new Date();
  const tmrwMorning = setMinutes(setHours(addDays(now, 1), 8), 0);
  const tmrwAfternoon = setMinutes(setHours(addDays(now, 1), 13), 0);
  const nxtFriday = setMinutes(setHours(nextFriday(now), 8), 0);
  
  const scheduleOptions = [
    { label: 'Tomorrow morning', date: tmrwMorning },
    { label: 'Tomorrow afternoon', date: tmrwAfternoon },
    { label: 'Friday morning', date: nxtFriday }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (toRecipients.length === 0) {
      toast.error('Please add at least one recipient');
      return;
    }
    if (!bodyText.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setIsSending(true);
    try {
      const formData = new FormData();
      formData.append('replyText', bodyText);
      if (threadId) formData.append('threadId', threadId);
      formData.append('to', toRecipients.join(', '));
      formData.append('subject', subject || '');
      if (scheduleAt) {
        formData.append('scheduleAt', scheduleAt.toISOString());
      }
      attachments.forEach(file => {
        formData.append('attachments', file);
      });

      const res = await fetch(`/api/mail/${emailId}/reply`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Failed to send reply');
      }

      toast.success(scheduleAt ? 'Reply scheduled successfully' : 'Reply sent successfully');
      setBodyText('');
      setAttachments([]);
      setScheduleAt(null);
      onClose();
    } catch (error) {
      toast.error('Failed to send reply');
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

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
          value={bodyText}
          onChange={(e) => setBodyText(e.target.value)}
          placeholder='Write, or press "space" for AI, "/" for commands...'
          className="w-full min-h-[250px] bg-transparent resize-none outline-none text-[15px] text-text-primary placeholder:text-text-muted leading-relaxed"
        />
      </div>

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="px-6 py-2 flex flex-wrap gap-2">
          {attachments.map((file, idx) => (
            <div key={idx} className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-bg-surface border border-border-subtle text-[13px] text-text-primary">
              <Paperclip className="h-3.5 w-3.5 text-text-muted" />
              <span className="truncate max-w-[150px]">{file.name}</span>
              <button 
                type="button" 
                onClick={() => removeAttachment(idx)}
                className="text-text-muted hover:text-text-primary transition-colors ml-1"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Bottom Toolbar */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="relative">
          <div className="flex items-stretch shadow-sm rounded-lg overflow-hidden">
            <button 
              type="button" 
              onClick={handleSend}
              disabled={isSending}
              className="flex items-center gap-2 px-6 py-2 bg-accent-blue hover:bg-accent-blue-dim text-white text-[15px] font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSending ? 'Sending...' : scheduleAt ? 'Schedule' : 'Send'}
            </button>
            <div className="w-[1px] bg-white/20"></div>
            <button 
              type="button" 
              aria-label="Send options" 
              onClick={() => setShowScheduleSend(!showScheduleSend)}
              className="flex items-center justify-center px-3 py-2 bg-accent-blue hover:bg-accent-blue-dim text-white transition-colors"
            >
              <ChevronDown className="h-5 w-5" />
            </button>
          </div>
          
          {showScheduleSend && (
            <div className="absolute bottom-[calc(100%+8px)] left-0 w-[300px] bg-bg-elevated text-text-primary rounded-xl shadow-2xl border border-border-subtle overflow-hidden flex flex-col z-50 animate-in fade-in zoom-in-95 duration-200 py-1">
              <div className="px-5 py-3 text-[14px] font-medium text-text-muted flex justify-between items-center">
                <span>Schedule send</span>
                {scheduleAt && (
                  <button 
                    className="text-accent-blue text-[13px] hover:underline"
                    onClick={() => {
                      setScheduleAt(null);
                      setShowScheduleSend(false);
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
              
              {scheduleOptions.map((opt, i) => (
                <button 
                  key={i}
                  onClick={() => {
                    setScheduleAt(opt.date);
                    setShowScheduleSend(false);
                  }}
                  className="flex items-center gap-4 px-5 py-3 hover:bg-bg-surface transition-colors text-left group"
                >
                  <div className="flex flex-col items-center justify-center w-9 h-10 rounded-md border border-border-default bg-transparent flex-shrink-0 group-hover:bg-bg-surface transition-colors">
                    <span className="text-[10px] font-bold text-red-400 mt-0.5">{format(opt.date, 'EEE').toUpperCase()}</span>
                    <span className="text-[14px] font-bold leading-tight text-text-primary">{format(opt.date, 'd')}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[15px] text-text-primary font-medium">{opt.label}</span>
                    <span className="text-[13px] text-text-muted">{format(opt.date, 'MMM d, h:mm a')}</span>
                  </div>
                </button>
              ))}

              <div className="h-[1px] bg-border-subtle mx-5 my-1"></div>

              <div className="px-5 py-3">
                <span className="text-[13px] text-text-muted mb-2 block">Custom time</span>
                <input 
                  type="datetime-local" 
                  className="w-full bg-bg-surface border border-border-default rounded-md px-3 py-2 text-[13px] text-text-primary outline-none focus:border-accent-blue"
                  onChange={(e) => {
                    if (e.target.value) {
                      setScheduleAt(new Date(e.target.value));
                      setShowScheduleSend(false);
                    }
                  }}
                />
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-4 text-text-muted">
          <button type="button" aria-label="AI Assistant" className="hover:text-text-primary transition-colors">
            <Sparkles className="h-5 w-5" />
          </button>
          
          <input 
            type="file" 
            multiple 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <button 
            type="button" 
            aria-label="Attach file" 
            className="hover:text-text-primary transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
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
