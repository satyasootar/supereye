import { useState, useRef, useCallback, KeyboardEvent } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { addDays, setHours, setMinutes, nextFriday, format } from 'date-fns';
import { 
  X, Minus, Sparkles, Paperclip, Code, Calendar as CalendarIcon, 
  Trash2, ChevronDown, Maximize2, Minimize2
} from 'lucide-react';
import { useAppStore } from '@/lib/store/app-store';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

type ComposeTone =
  | 'professional'
  | 'friendly'
  | 'formal'
  | 'persuasive'
  | 'concise'
  | 'empathetic';

type MailTemplate = {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  isPredefined: boolean;
};

const TONE_OPTIONS: { value: ComposeTone; label: string }[] = [
  { value: 'professional', label: 'Professional' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'formal', label: 'Formal' },
  { value: 'persuasive', label: 'Persuasive' },
  { value: 'concise', label: 'Concise' },
  { value: 'empathetic', label: 'Empathetic' },
];

const COMPOSE_SIZE_DEFAULT = { width: 520, height: 520 };
const COMPOSE_SIZE_EXPANDED = { width: 820, height: 720 };
const COMPOSE_SIZE_MIN = { width: 400, height: 320 };
const COMPOSE_SIZE_MAX = { width: 1200, height: 900 };

export function GlobalComposer() {
  const { isComposeOpen, setComposeOpen } = useAppStore();
  const { data: session } = useSession();
  
  const [toRecipients, setToRecipients] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [subject, setSubject] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [htmlBody, setHtmlBody] = useState('');
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showScheduleSend, setShowScheduleSend] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [scheduleAt, setScheduleAt] = useState<Date | null>(null);
  const [tone, setTone] = useState<ComposeTone>('professional');
  const [showTemplates, setShowTemplates] = useState(false);
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);
  const [showHtmlPreview, setShowHtmlPreview] = useState(false);
  const [enhancedDraft, setEnhancedDraft] = useState<string | null>(null);
  const [originalDraft, setOriginalDraft] = useState<string | null>(null);
  const [composeSize, setComposeSize] = useState(COMPOSE_SIZE_DEFAULT);
  const [isExpanded, setIsExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragControls = useDragControls();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const queryClient = useQueryClient();
  const draftValue = isHtmlMode ? htmlBody : bodyText;

  const templatesQuery = useQuery<{ templates: MailTemplate[] }>({
    queryKey: ['mail-templates'],
    queryFn: async () => {
      const res = await fetch('/api/mail/templates');
      if (!res.ok) throw new Error('Failed to load templates');
      return res.json();
    },
    enabled: isComposeOpen && showTemplates,
  });

  const enhanceMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/mail/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draft: draftValue,
          tone,
          isHtml: isHtmlMode,
          subject,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Enhance failed');
      }
      return res.json() as Promise<{ enhanced: string }>;
    },
    onSuccess: (data) => setEnhancedDraft(data.enhanced),
  });

  const openHtmlPreview = () => {
    if (!isHtmlMode || !htmlBody.trim()) {
      toast.error('Switch to HTML mode and load template/content first');
      return;
    }
    const previewWindow = window.open('', '_blank', 'width=960,height=720');
    if (!previewWindow) {
      toast.error('Popup blocked. Please allow popups to preview HTML.');
      return;
    }
    previewWindow.document.write(htmlBody);
    previewWindow.document.close();
  };

  const toggleExpanded = useCallback(() => {
    if (isMinimized) setIsMinimized(false);
    setIsExpanded((prev) => {
      const next = !prev;
      setComposeSize(next ? COMPOSE_SIZE_EXPANDED : COMPOSE_SIZE_DEFAULT);
      return next;
    });
  }, [isMinimized]);

  const handleResizePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      const startX = e.clientX;
      const startY = e.clientY;
      const startW = composeSize.width;
      const startH = composeSize.height;

      const onMove = (ev: PointerEvent) => {
        const width = Math.min(
          COMPOSE_SIZE_MAX.width,
          Math.max(COMPOSE_SIZE_MIN.width, startW - (ev.clientX - startX))
        );
        const height = Math.min(
          COMPOSE_SIZE_MAX.height,
          Math.max(COMPOSE_SIZE_MIN.height, startH - (ev.clientY - startY))
        );
        setComposeSize({ width, height });
        setIsExpanded(false);
      };

      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      };

      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'nwse-resize';
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    },
    [composeSize.height, composeSize.width]
  );

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

  const handleSend = async (isDraft = false) => {
    const finalTo = [...toRecipients];
    if (inputValue.trim()) {
      finalTo.push(inputValue.trim().replace(/,/g, ''));
    }

    if (finalTo.length === 0 && !isDraft) {
      toast.error('Please add at least one recipient');
      return;
    }

    setIsSending(true);
    try {
      const formData = new FormData();
      formData.append('to', finalTo.join(', '));
      formData.append('subject', subject);
      const finalText = isHtmlMode ? htmlBody.replace(/<[^>]*>/g, ' ') : bodyText;
      formData.append('text', finalText);
      if (isHtmlMode && htmlBody.trim()) {
        formData.append('html', htmlBody);
      }
      if (scheduleAt && !isDraft) {
        formData.append('scheduleAt', scheduleAt.toISOString());
      }
      if (isDraft) {
        formData.append('isDraft', 'true');
      }
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

      if (isDraft) {
        toast.success('Draft saved');
      } else {
        toast.success(scheduleAt ? 'Message scheduled' : 'Message sent');
      }
      setComposeOpen(false);
      setToRecipients([]);
      setSubject('');
      setBodyText('');
      setHtmlBody('');
      setIsHtmlMode(false);
      setInputValue('');
      setAttachments([]);
      setScheduleAt(null);
      setIsMinimized(false);
      setEnhancedDraft(null);
      setOriginalDraft(null);
      setComposeSize(COMPOSE_SIZE_DEFAULT);
      setIsExpanded(false);
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

  // Calculate dynamic schedule times
  const now = new Date();
  const tmrwMorning = setMinutes(setHours(addDays(now, 1), 8), 0);
  const tmrwAfternoon = setMinutes(setHours(addDays(now, 1), 13), 0);
  const nxtFriday = setMinutes(setHours(nextFriday(now), 8), 0);
  // Ensure we don't show a past time (e.g., if it's already past 1pm)
  
  const scheduleOptions = [
    { label: 'Tomorrow morning', date: tmrwMorning },
    { label: 'Tomorrow afternoon', date: tmrwAfternoon },
    { label: 'Friday morning', date: nxtFriday }
  ];

  return (
    <motion.div 
      drag={!isMinimized}
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        'fixed bottom-0 right-24 z-[999] flex flex-col bg-bg-elevated border border-border-subtle rounded-t-xl shadow-2xl will-change-transform overflow-hidden'
      )}
      style={{
        width: isMinimized ? 300 : composeSize.width,
        height: isMinimized ? 44 : composeSize.height,
        minWidth: isMinimized ? 300 : COMPOSE_SIZE_MIN.width,
        minHeight: isMinimized ? 44 : COMPOSE_SIZE_MIN.height,
        maxWidth: COMPOSE_SIZE_MAX.width,
        maxHeight: COMPOSE_SIZE_MAX.height,
      }}
    >
      {!isMinimized && (
        <div
          role="separator"
          aria-label="Resize compose window"
          onPointerDown={handleResizePointerDown}
          className="absolute left-0 top-0 z-20 h-4 w-4 cursor-nwse-resize rounded-tl-xl bg-gradient-to-br from-border-subtle/80 to-transparent"
          title="Drag to resize"
        />
      )}
      {/* Header (Drag Handle) */}
      <div
        className="drag-handle flex items-center justify-between px-4 h-[44px] bg-bg-surface border-b border-border-subtle cursor-grab active:cursor-grabbing flex-shrink-0"
        onPointerDown={(e) => {
          if (!isMinimized) dragControls.start(e);
        }}
      >
        <div className="flex items-center gap-2 overflow-hidden flex-1">
          <span className="text-[13px] font-medium text-text-primary truncate">{userName}</span>
          {userEmail && <span className="text-[13px] text-text-muted truncate">{userEmail}</span>}
        </div>
        <div className="flex items-center gap-2 ml-4 text-text-muted">
          {!isMinimized && (
            <button
              type="button"
              onClick={toggleExpanded}
              className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-bg-overlay hover:text-text-primary transition-colors"
              title={isExpanded ? 'Restore default size' : 'Expand compose window'}
              aria-label={isExpanded ? 'Restore default size' : 'Expand compose window'}
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          )}
          <button 
            type="button" 
            onClick={() => setIsMinimized(!isMinimized)}
            className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-bg-overlay hover:text-text-primary transition-colors"
            title={isMinimized ? 'Restore' : 'Minimize'}
            aria-label={isMinimized ? 'Restore' : 'Minimize'}
          >
            <Minus className="h-4 w-4" />
          </button>
          <button 
            type="button" 
            onClick={() => {
              setComposeOpen(false);
              setIsMinimized(false);
              setEnhancedDraft(null);
              setOriginalDraft(null);
              setComposeSize(COMPOSE_SIZE_DEFAULT);
              setIsExpanded(false);
            }}
            className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-bg-overlay hover:text-text-primary transition-colors"
            title="Close"
            aria-label="Close"
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
            {enhancedDraft && (
              <div className="mb-3 rounded-md border border-accent-blue/30 bg-accent-blue/10 p-3 text-xs text-text-primary">
                AI rewrite ready.
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    className="rounded bg-accent-blue px-2 py-1 text-white"
                    onClick={() => {
                      if (isHtmlMode) setHtmlBody(enhancedDraft);
                      else setBodyText(enhancedDraft);
                      setEnhancedDraft(null);
                    }}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    className="rounded border border-border-subtle px-2 py-1"
                    onClick={() => enhanceMutation.mutate()}
                  >
                    Regenerate
                  </button>
                  <button
                    type="button"
                    className="rounded border border-border-subtle px-2 py-1"
                    onClick={() => {
                      if (originalDraft != null) {
                        if (isHtmlMode) setHtmlBody(originalDraft);
                        else setBodyText(originalDraft);
                      }
                      setEnhancedDraft(null);
                    }}
                  >
                    Revert
                  </button>
                </div>
              </div>
            )}
            <textarea 
              placeholder="..."
              value={isHtmlMode ? htmlBody : bodyText}
              onChange={(e) => {
                if (isHtmlMode) setHtmlBody(e.target.value);
                else setBodyText(e.target.value);
              }}
              className="w-full h-full min-h-[150px] bg-transparent resize-none outline-none text-[14px] text-text-primary placeholder:text-text-muted no-scrollbar"
            />
          </div>

          {/* Attachments List */}
          {showTemplates && (
            <div className="max-h-[280px] overflow-y-auto border-t border-border-subtle px-4 py-3">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-medium text-text-muted">Marketing templates</p>
                <button
                  type="button"
                  className="h-8 min-w-[140px] rounded-md border border-border-subtle px-3 text-xs font-medium text-accent-blue hover:bg-bg-overlay"
                  onClick={async () => {
                    if (!htmlBody.trim()) return toast.error('Add HTML content first');
                    const name = window.prompt('Template name');
                    if (!name) return;
                    const res = await fetch('/api/mail/templates', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        name,
                        subject,
                        htmlContent: htmlBody,
                      }),
                    });
                    if (!res.ok) return toast.error('Failed to save template');
                    toast.success('Template saved');
                    void queryClient.invalidateQueries({ queryKey: ['mail-templates'] });
                  }}
                >
                  Save current template
                </button>
              </div>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {(templatesQuery.data?.templates ?? []).map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    className="w-full rounded-md border border-border-subtle bg-bg-surface p-3 text-left text-xs transition-colors hover:border-accent-blue/40 hover:bg-bg-overlay"
                    onClick={() => {
                      setPreviewTemplateId(tpl.id);
                      setSubject(tpl.subject);
                      setHtmlBody(tpl.htmlContent);
                      setIsHtmlMode(true);
                    }}
                  >
                    <p className="font-medium text-text-primary">
                      {tpl.name} {tpl.isPredefined ? '(built-in)' : ''}
                    </p>
                    <p className="truncate text-text-muted">{tpl.subject || 'No subject'}</p>
                  </button>
                ))}
              </div>
              {previewTemplateId && (
                <div className="mt-3 rounded border border-border-subtle bg-bg-base p-2">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[11px] text-text-muted">Template preview</p>
                    <button
                      type="button"
                      className="h-7 rounded-md border border-border-subtle px-2 text-[11px] text-text-primary hover:bg-bg-overlay"
                      onClick={() => setShowHtmlPreview((v) => !v)}
                    >
                      {showHtmlPreview ? 'Hide preview' : 'Show preview'}
                    </button>
                  </div>
                  {showHtmlPreview && (
                  <iframe
                    title="Template preview"
                    className="h-52 w-full rounded border border-border-subtle bg-white"
                    srcDoc={
                      templatesQuery.data?.templates.find((t) => t.id === previewTemplateId)?.htmlContent ?? ''
                    }
                  />
                  )}
                </div>
              )}
            </div>
          )}

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
          <div className="flex flex-col gap-3 px-4 py-3 bg-bg-surface border-t border-border-subtle flex-shrink-0">
            <div className="flex items-center justify-between gap-3">
            <div className="relative shrink-0">
              <div className="flex items-stretch rounded-md overflow-hidden shadow-sm">
                <button 
                  type="button" 
                  onClick={() => handleSend(false)}
                  disabled={isSending}
                  className="flex h-9 min-w-[92px] items-center justify-center px-4 bg-accent-blue hover:bg-accent-blue-dim text-white text-[13px] font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSending ? 'Sending...' : scheduleAt ? `Schedule send` : 'Send'}
                </button>
                <div className="w-[1px] bg-white/20"></div>
                <button 
                  type="button" 
                  onClick={() => setShowScheduleSend(!showScheduleSend)}
                  disabled={isSending}
                  className="flex h-9 w-9 items-center justify-center bg-accent-blue hover:bg-accent-blue-dim text-white transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <ChevronDown className="h-4 w-4" />
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
            
            <div className="flex flex-wrap items-center justify-end gap-2 text-text-muted">
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as ComposeTone)}
                className="h-9 min-w-[110px] rounded-md border border-border-subtle bg-bg-elevated px-2 text-xs text-text-primary"
              >
                {TONE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="h-9 min-w-[92px] rounded-md border border-border-subtle px-3 text-xs font-medium hover:text-text-primary transition-colors"
                onClick={() => {
                  if (!draftValue.trim()) return toast.error('Draft is empty');
                  setOriginalDraft(draftValue);
                  enhanceMutation.mutate();
                }}
                disabled={enhanceMutation.isPending}
              >
                {enhanceMutation.isPending ? 'Enhancing...' : 'AI Enhance'}
              </button>
              <button
                type="button"
                className="h-9 min-w-[92px] rounded-md border border-border-subtle px-3 text-xs font-medium hover:text-text-primary transition-colors"
                onClick={() => setShowTemplates((v) => !v)}
              >
                Templates
              </button>
              <button
                type="button"
                className="h-9 min-w-[80px] rounded-md border border-border-subtle px-3 text-xs font-medium hover:text-text-primary transition-colors"
                onClick={() => setIsHtmlMode((v) => !v)}
                title="Toggle HTML mode"
              >
                {isHtmlMode ? 'HTML on' : 'HTML off'}
              </button>
              <button
                type="button"
                className="h-9 min-w-[84px] rounded-md border border-border-subtle px-3 text-xs font-medium hover:text-text-primary transition-colors"
                onClick={openHtmlPreview}
              >
                Preview
              </button>
              <button type="button" className="flex h-9 w-9 items-center justify-center rounded-md border border-border-subtle hover:text-text-primary transition-colors" title="AI tools">
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
                className="flex h-9 w-9 items-center justify-center rounded-md border border-border-subtle hover:text-text-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <button type="button" className="flex h-9 w-9 items-center justify-center rounded-md border border-border-subtle hover:text-text-primary transition-colors">
                <Code className="h-4 w-4" />
              </button>
              <button type="button" className="flex h-9 w-9 items-center justify-center rounded-md border border-border-subtle hover:text-text-primary transition-colors">
                <CalendarIcon className="h-4 w-4" />
              </button>
              <div className="w-[1px] h-4 bg-border-strong mx-1"></div>
              <button 
                type="button" 
                onClick={() => handleSend(true)}
                disabled={isSending}
                className="h-9 min-w-[92px] rounded-md border border-border-subtle px-3 text-xs font-medium hover:text-text-primary transition-colors"
              >
                Save Draft
              </button>
              <button 
                type="button"
                onClick={() => {
                  setComposeOpen(false);
                  setIsMinimized(false);
                  setEnhancedDraft(null);
                  setOriginalDraft(null);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-border-subtle hover:text-text-primary transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
