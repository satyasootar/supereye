import { useState, useRef, KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { 
  X, Minus, Sparkles, Paperclip, Code, Calendar as CalendarIcon, 
  Trash2, ChevronDown
} from 'lucide-react';
import { useAppStore } from '@/lib/store/app-store';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function GlobalComposer() {
  const { isComposeOpen, setComposeOpen } = useAppStore();
  const { data: session } = useSession();
  
  const [toRecipients, setToRecipients] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [subject, setSubject] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [showScheduleSend, setShowScheduleSend] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const queryClient = useQueryClient();

  if (!isComposeOpen) return null;

  // Extract unique senders from the cached emails
  const getSuggestions = (search: string) => {
    if (!search || search.trim().length < 1) return [];
    
    const allCacheData = queryClient.getQueriesData({ queryKey: ['emails', 'threads'] });
    const senders = new Set<string>();
    
    allCacheData.forEach(([_, data]: any) => {
      if (data?.pages) {
        data.pages.forEach((page: any) => {
          page.forEach((msg: any) => {
            if (msg.sender) {
              // Extract just the email part if it's formatted like "Name <email@domain.com>"
              const match = msg.sender.match(/<([^>]+)>/);
              const email = match ? match[1] : msg.sender;
              senders.add(email.trim());
            }
          });
        });
      }
    });
    
    const searchLower = search.toLowerCase();
    return Array.from(senders).filter(sender => 
      sender.toLowerCase().includes(searchLower) && !toRecipients.includes(sender)
    ).slice(0, 5);
  };

  const suggestions = getSuggestions(inputValue);

  const handleSend = async () => {
    if (toRecipients.length === 0) {
      toast.error('Please add at least one recipient');
      return;
    }

    setIsSending(true);
    try {
      const formData = new FormData();
      formData.append('to', toRecipients.join(', '));
      formData.append('subject', subject);
      formData.append('text', bodyText);
      attachments.forEach(file => {
        formData.append('attachments', file);
      });

      const res = await fetch('/api/mail/send', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Failed to send email');
      }

      toast.success('Message sent');
      setComposeOpen(false);
      setToRecipients([]);
      setSubject('');
      setBodyText('');
      setInputValue('');
      setAttachments([]);
      setIsMinimized(false);
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (['Enter', ' ', ','].includes(e.key)) {
      e.preventDefault();
      const val = inputValue.trim().replace(/,/g, '');
      if (val && !toRecipients.includes(val)) {
        setToRecipients([...toRecipients, val]);
        setInputValue('');
      }
    } else if (e.key === 'Backspace' && !inputValue && toRecipients.length > 0) {
      setToRecipients(toRecipients.slice(0, -1));
    }
  };

  const removeRecipient = (indexToRemove: number) => {
    setToRecipients(toRecipients.filter((_, idx) => idx !== indexToRemove));
  };

  const userName = session?.user?.name?.toUpperCase() || 'NEW MESSAGE';
  const userEmail = session?.user?.email || '';

  return (
    <motion.div 
      drag
      dragMomentum={false}
      dragHandle=".drag-handle"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "fixed bottom-0 right-24 z-[999] flex flex-col bg-bg-elevated border border-border-subtle rounded-t-xl shadow-2xl overflow-hidden will-change-transform",
        isMinimized ? "h-[44px] w-[300px]" : "h-[500px] w-[500px] resize overflow-hidden"
      )}
      style={{
        minWidth: isMinimized ? '300px' : '400px',
        minHeight: isMinimized ? '44px' : '300px'
      }}
    >
      {/* Header (Drag Handle) */}
      <div className="drag-handle flex items-center justify-between px-4 h-[44px] bg-bg-surface border-b border-border-subtle cursor-grab active:cursor-grabbing flex-shrink-0">
        <div className="flex items-center gap-2 overflow-hidden flex-1">
          <span className="text-[13px] font-medium text-text-primary truncate">{userName}</span>
          {userEmail && <span className="text-[13px] text-text-muted truncate">{userEmail}</span>}
        </div>
        <div className="flex items-center gap-3 ml-4 text-text-muted">
          <button 
            type="button" 
            onClick={() => setIsMinimized(!isMinimized)}
            className="hover:text-text-primary transition-colors"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button 
            type="button" 
            onClick={() => {
              setComposeOpen(false);
              setIsMinimized(false);
            }}
            className="hover:text-text-primary transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* To Field */}
          <div className="flex items-start px-4 min-h-[44px] py-2 border-b border-border-subtle flex-shrink-0">
            <span className="text-[14px] text-text-muted w-[50px] mt-1">To</span>
            <div className="flex items-center gap-2 flex-wrap flex-1">
              {toRecipients.map((recipient, idx) => (
                <div key={idx} className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-bg-overlay text-[13px] text-text-primary border border-border-subtle max-w-full">
                  <span className="truncate">{recipient}</span>
                  <button 
                    type="button"
                    onClick={() => removeRecipient(idx)}
                    className="text-text-muted hover:text-text-primary transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <div className="relative flex-1 min-w-[120px] mt-0.5">
                <input 
                  type="text"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-transparent text-[14px] text-text-primary outline-none"
                />
                
                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 mt-2 w-full max-w-[250px] bg-bg-elevated border border-border-subtle rounded-md shadow-xl z-[1000] overflow-hidden">
                    {suggestions.map(s => (
                      <button 
                        key={s} 
                        type="button"
                        className="w-full text-left px-3 py-2 text-[13px] text-text-primary hover:bg-bg-surface truncate transition-colors"
                        onMouseDown={(e) => {
                           e.preventDefault();
                           setToRecipients([...toRecipients, s]);
                           setInputValue('');
                           setShowSuggestions(false);
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 text-[13px] text-text-muted mt-1">
              <button className="hover:text-text-primary transition-colors font-medium">Cc</button>
              <button className="hover:text-text-primary transition-colors font-medium">Bcc</button>
            </div>
          </div>

          {/* Subject Field */}
          <div className="flex items-center px-4 h-[44px] border-b border-border-subtle flex-shrink-0">
            <input 
              type="text"
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-transparent text-[14px] text-text-primary placeholder:text-text-muted outline-none font-medium"
            />
          </div>

          {/* Body */}
          <div className="flex-1 p-4 overflow-y-auto no-scrollbar">
            <textarea 
              placeholder="..."
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              className="w-full h-full min-h-[150px] bg-transparent resize-none outline-none text-[14px] text-text-primary placeholder:text-text-muted no-scrollbar"
            />
          </div>

          {/* Attachments List */}
          {attachments.length > 0 && (
            <div className="px-4 py-2 flex flex-wrap gap-2 border-t border-border-subtle">
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

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 bg-bg-surface border-t border-border-subtle flex-shrink-0">
            <div className="relative">
              <div className="flex items-stretch rounded-md overflow-hidden shadow-sm">
                <button 
                  type="button" 
                  onClick={handleSend}
                  disabled={isSending}
                  className="flex items-center px-5 py-1.5 bg-accent-blue hover:bg-accent-blue-dim text-white text-[14px] font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSending ? 'Sending...' : 'Send'}
                </button>
                <div className="w-[1px] bg-white/20"></div>
                <button 
                  type="button" 
                  onClick={() => setShowScheduleSend(!showScheduleSend)}
                  disabled={isSending}
                  className="flex items-center justify-center px-2 py-1.5 bg-accent-blue hover:bg-accent-blue-dim text-white transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-3 text-text-muted">
              <button type="button" className="hover:text-text-primary transition-colors">
                <Sparkles className="h-4 w-4" />
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
                className="hover:text-text-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <button type="button" className="hover:text-text-primary transition-colors">
                <Code className="h-4 w-4" />
              </button>
              <button type="button" className="hover:text-text-primary transition-colors">
                <CalendarIcon className="h-4 w-4" />
              </button>
              <div className="w-[1px] h-4 bg-border-strong mx-1"></div>
              <button 
                type="button"
                onClick={() => {
                  setComposeOpen(false);
                  setIsMinimized(false);
                }}
                className="hover:text-text-primary transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
