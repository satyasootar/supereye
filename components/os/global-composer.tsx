import { useState, useRef, useCallback, useEffect, KeyboardEvent } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { addDays, setHours, setMinutes, nextFriday, format } from 'date-fns';
import { 
  X, Minus, Sparkles, Paperclip, Code, Calendar as CalendarIcon, 
  Trash2, ChevronDown, Maximize2, Minimize2, MoreHorizontal,
  Bold, Italic, Underline
} from 'lucide-react';
import { useAppStore } from '@/lib/store/app-store';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { TemplatePickerModal } from './template-picker-modal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

type ComposeTone =
  | 'professional'
  | 'friendly'
  | 'formal'
  | 'persuasive'
  | 'concise'
  | 'empathetic';

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
  const [ccRecipients, setCcRecipients] = useState<string[]>([]);
  const [ccInputValue, setCcInputValue] = useState('');
  const [bccRecipients, setBccRecipients] = useState<string[]>([]);
  const [bccInputValue, setBccInputValue] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [subject, setSubject] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [htmlBody, setHtmlBody] = useState('');
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showScheduleSend, setShowScheduleSend] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [scheduleAt, setScheduleAt] = useState<Date | null>(null);
  const [tone, setTone] = useState<ComposeTone>('professional');
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [enhancedDraft, setEnhancedDraft] = useState<string | null>(null);
  const [originalDraft, setOriginalDraft] = useState<string | null>(null);
  const [composeSize, setComposeSize] = useState(COMPOSE_SIZE_DEFAULT);
  const [isExpanded, setIsExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);
  const ccInputRef = useRef<HTMLInputElement>(null);
  const bccInputRef = useRef<HTMLInputElement>(null);
  const dragControls = useDragControls();

  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);
  const [floatingMenuCoords, setFloatingMenuCoords] = useState<{ x: number; y: number } | null>(null);
  const [isEnhancingSelection, setIsEnhancingSelection] = useState(false);

  const handleMouseUp = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    if (start !== end) {
      setFloatingMenuCoords({
        x: e.clientX,
        y: e.clientY - 15,
      });
      setSelectedText(textarea.value.substring(start, end));
      setSelectionRange({ start, end });
    } else {
      setSelectedText('');
      setSelectionRange(null);
      setFloatingMenuCoords(null);
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    if (start !== end) {
      const rect = textarea.getBoundingClientRect();
      setFloatingMenuCoords({
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
      });
      setSelectedText(textarea.value.substring(start, end));
      setSelectionRange({ start, end });
    } else {
      setSelectedText('');
      setSelectionRange(null);
      setFloatingMenuCoords(null);
    }
  };

  const applyFormat = (formatType: 'bold' | 'italic' | 'underline') => {
    if (!selectionRange) return;
    const val = isHtmlMode ? htmlBody : bodyText;
    const selected = val.substring(selectionRange.start, selectionRange.end);
    let formatted = selected;

    if (isHtmlMode) {
      if (formatType === 'bold') formatted = `<strong>${selected}</strong>`;
      else if (formatType === 'italic') formatted = `<em>${selected}</em>`;
      else if (formatType === 'underline') formatted = `<u>${selected}</u>`;
    } else {
      if (formatType === 'bold') formatted = `**${selected}**`;
      else if (formatType === 'italic') formatted = `*${selected}*`;
      else if (formatType === 'underline') formatted = `<u>${selected}</u>`;
    }

    const newVal = val.substring(0, selectionRange.start) + formatted + val.substring(selectionRange.end);
    if (isHtmlMode) setHtmlBody(newVal);
    else setBodyText(newVal);

    setSelectedText('');
    setSelectionRange(null);
    setFloatingMenuCoords(null);
  };

  const handleEnhanceSelection = async () => {
    if (!selectedText.trim()) return;
    setIsEnhancingSelection(true);
    try {
      const res = await fetch('/api/mail/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draft: selectedText,
          tone,
          isHtml: isHtmlMode,
          subject: `Selection enhancement`,
        }),
      });
      if (!res.ok) throw new Error('Failed to enhance');
      const data = await res.json();
      
      if (selectionRange) {
        const val = isHtmlMode ? htmlBody : bodyText;
        const newVal = val.substring(0, selectionRange.start) + data.enhanced + val.substring(selectionRange.end);
        if (isHtmlMode) setHtmlBody(newVal);
        else setBodyText(newVal);
      }
      toast.success('Selection enhanced');
    } catch (e) {
      toast.error('Failed to enhance selection');
    } finally {
      setIsEnhancingSelection(false);
      setSelectedText('');
      setSelectionRange(null);
      setFloatingMenuCoords(null);
    }
  };

  useEffect(() => {
    if (!floatingMenuCoords) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.floating-format-menu')) return;
      setSelectedText('');
      setSelectionRange(null);
      setFloatingMenuCoords(null);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [floatingMenuCoords]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const [draftStatus, setDraftStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const saveDraftSilently = useCallback(async (
    currentTo: string[],
    currentCc: string[],
    currentBcc: string[],
    currentSubject: string,
    currentBody: string,
    currentHtml: string,
    currentIsHtml: boolean
  ) => {
    if (
      currentTo.length === 0 &&
      currentCc.length === 0 &&
      currentBcc.length === 0 &&
      !currentSubject.trim() &&
      !currentBody.trim() &&
      !currentHtml.trim()
    ) {
      return;
    }
    setDraftStatus('saving');
    try {
      const formData = new FormData();
      formData.append('to', currentTo.join(', '));
      if (currentCc.length > 0) formData.append('cc', currentCc.join(', '));
      if (currentBcc.length > 0) formData.append('bcc', currentBcc.join(', '));
      formData.append('subject', currentSubject);
      const finalText = currentIsHtml ? currentHtml.replace(/<[^>]*>/g, ' ') : currentBody;
      formData.append('text', finalText);
      if (currentIsHtml && currentHtml.trim()) {
        formData.append('html', currentHtml);
      }
      formData.append('isDraft', 'true');

      const res = await fetch('/api/mail/send', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to save draft');
      setDraftStatus('saved');
    } catch (e) {
      console.error('Auto-save draft failed:', e);
      setDraftStatus('idle');
    }
  }, []);

  useEffect(() => {
    if (
      toRecipients.length === 0 &&
      ccRecipients.length === 0 &&
      bccRecipients.length === 0 &&
      !subject.trim() &&
      !bodyText.trim() &&
      !htmlBody.trim()
    ) {
      setDraftStatus('idle');
      return;
    }
    const timer = setTimeout(() => {
      saveDraftSilently(toRecipients, ccRecipients, bccRecipients, subject, bodyText, htmlBody, isHtmlMode);
    }, 1500);
    return () => clearTimeout(timer);
  }, [toRecipients, ccRecipients, bccRecipients, subject, bodyText, htmlBody, isHtmlMode, saveDraftSilently]);

  const queryClient = useQueryClient();
  const draftValue = isHtmlMode ? htmlBody : bodyText;

  const enhanceMutation = useMutation({
    mutationFn: async (overrideTone?: ComposeTone) => {
      const res = await fetch('/api/mail/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draft: draftValue,
          tone: overrideTone || tone,
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

  const collectRecipients = () => {
    const finalTo = [...toRecipients];
    if (inputValue.trim()) {
      finalTo.push(inputValue.trim().replace(/,/g, ''));
    }

    const finalCc = [...ccRecipients];
    if (ccInputValue.trim()) {
      finalCc.push(ccInputValue.trim().replace(/,/g, ''));
    }

    const finalBcc = [...bccRecipients];
    if (bccInputValue.trim()) {
      finalBcc.push(bccInputValue.trim().replace(/,/g, ''));
    }

    return { finalTo, finalCc, finalBcc };
  };

  const buildComposeFormData = (
    finalTo: string[],
    finalCc: string[],
    finalBcc: string[],
    isDraft: boolean
  ) => {
    const formData = new FormData();
    formData.append('to', finalTo.join(', '));
    if (finalCc.length > 0) {
      formData.append('cc', finalCc.join(', '));
    }
    if (finalBcc.length > 0) {
      formData.append('bcc', finalBcc.join(', '));
    }
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
    attachments.forEach((file) => {
      formData.append('attachments', file);
    });
    return formData;
  };

  const resetCompose = () => {
    setComposeOpen(false);
    setToRecipients([]);
    setCcRecipients([]);
    setBccRecipients([]);
    setInputValue('');
    setCcInputValue('');
    setBccInputValue('');
    setShowCc(false);
    setShowBcc(false);
    setSubject('');
    setBodyText('');
    setHtmlBody('');
    setIsHtmlMode(false);
    setAttachments([]);
    setScheduleAt(null);
    setIsMinimized(false);
    setEnhancedDraft(null);
    setOriginalDraft(null);
    setComposeSize(COMPOSE_SIZE_DEFAULT);
    setIsExpanded(false);
    setDraftStatus('idle');
  };

  const handleSaveDraft = async () => {
    if (isSending || isSavingDraft) return;

    const { finalTo, finalCc, finalBcc } = collectRecipients();
    setIsSavingDraft(true);
    setDraftStatus('saving');
    try {
      const formData = buildComposeFormData(finalTo, finalCc, finalBcc, true);
      const res = await fetch('/api/mail/send', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Failed to save draft');
      }

      toast.success('Draft saved');
      setDraftStatus('saved');
      await queryClient.invalidateQueries({ queryKey: ['emails', 'drafts'] });
      await queryClient.invalidateQueries({ queryKey: ['emails', 'threads'] });
    } catch (error) {
      console.error(error);
      toast.error('Failed to save draft');
      setDraftStatus('idle');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleSend = async () => {
    const { finalTo, finalCc, finalBcc } = collectRecipients();

    if (finalTo.length === 0 && finalCc.length === 0 && finalBcc.length === 0) {
      toast.error('Please add at least one recipient');
      return;
    }

    setIsSending(true);
    try {
      const formData = buildComposeFormData(finalTo, finalCc, finalBcc, false);
      const res = await fetch('/api/mail/send', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Failed to send email');
      }

      toast.success(scheduleAt ? 'Message scheduled' : 'Message sent');
      resetCompose();
    } catch (error) {
      console.error(error);
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

  const handleCcKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (['Enter', ' ', ','].includes(e.key)) {
      e.preventDefault();
      const val = ccInputValue.trim().replace(/,/g, '');
      if (val && !ccRecipients.includes(val)) {
        setCcRecipients([...ccRecipients, val]);
        setCcInputValue('');
      }
    } else if (e.key === 'Backspace' && !ccInputValue && ccRecipients.length > 0) {
      setCcRecipients(ccRecipients.slice(0, -1));
    }
  };

  const removeCcRecipient = (indexToRemove: number) => {
    setCcRecipients(ccRecipients.filter((_, idx) => idx !== indexToRemove));
  };

  const handleBccKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (['Enter', ' ', ','].includes(e.key)) {
      e.preventDefault();
      const val = bccInputValue.trim().replace(/,/g, '');
      if (val && !bccRecipients.includes(val)) {
        setBccRecipients([...bccRecipients, val]);
        setBccInputValue('');
      }
    } else if (e.key === 'Backspace' && !bccInputValue && bccRecipients.length > 0) {
      setBccRecipients(bccRecipients.slice(0, -1));
    }
  };

  const removeBccRecipient = (indexToRemove: number) => {
    setBccRecipients(bccRecipients.filter((_, idx) => idx !== indexToRemove));
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
    <>
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
          <div 
            onClick={() => toInputRef.current?.focus()}
            className="flex items-start px-4 min-h-[44px] py-2 border-b border-border-subtle flex-shrink-0 cursor-text"
          >
            <div className="flex items-center gap-2 flex-wrap flex-1">
              {toRecipients.map((recipient, idx) => (
                <div 
                  key={idx} 
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-bg-overlay text-[13px] text-text-primary border border-border-subtle max-w-full"
                >
                  <span className="truncate">{recipient}</span>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeRecipient(idx);
                    }}
                    className="text-text-muted hover:text-text-primary transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <div className="relative flex-1 min-w-[120px] mt-0.5" onClick={(e) => e.stopPropagation()}>
                <input 
                  ref={toInputRef}
                  type="text"
                  placeholder={toRecipients.length === 0 ? "To" : ""}
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-transparent text-[14px] text-text-primary placeholder:text-text-muted outline-none"
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
            <div 
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-3 text-[13px] text-text-muted mt-1"
            >
              <button 
                type="button"
                onClick={() => setShowCc(!showCc)}
                className={cn("hover:text-text-primary transition-colors font-medium", showCc && "text-accent-blue")}
              >
                Cc
              </button>
              <button 
                type="button"
                onClick={() => setShowBcc(!showBcc)}
                className={cn("hover:text-text-primary transition-colors font-medium", showBcc && "text-accent-blue")}
              >
                Bcc
              </button>
            </div>
          </div>

          {/* Cc Field */}
          {showCc && (
            <div 
              onClick={() => ccInputRef.current?.focus()}
              className="flex items-start px-4 min-h-[44px] py-2 border-b border-border-subtle flex-shrink-0 cursor-text"
            >
              <div className="flex items-center gap-2 flex-wrap flex-1">
                {ccRecipients.map((recipient, idx) => (
                  <div 
                    key={idx} 
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-bg-overlay text-[13px] text-text-primary border border-border-subtle max-w-full"
                  >
                    <span className="truncate">{recipient}</span>
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeCcRecipient(idx);
                      }}
                      className="text-text-muted hover:text-text-primary transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <div className="flex-1 min-w-[120px] mt-0.5" onClick={(e) => e.stopPropagation()}>
                  <input 
                    ref={ccInputRef}
                    type="text"
                    placeholder={ccRecipients.length === 0 ? "Cc" : ""}
                    value={ccInputValue}
                    onChange={(e) => setCcInputValue(e.target.value)}
                    onKeyDown={handleCcKeyDown}
                    className="w-full bg-transparent text-[14px] text-text-primary placeholder:text-text-muted outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Bcc Field */}
          {showBcc && (
            <div 
              onClick={() => bccInputRef.current?.focus()}
              className="flex items-start px-4 min-h-[44px] py-2 border-b border-border-subtle flex-shrink-0 cursor-text"
            >
              <div className="flex items-center gap-2 flex-wrap flex-1">
                {bccRecipients.map((recipient, idx) => (
                  <div 
                    key={idx} 
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-bg-overlay text-[13px] text-text-primary border border-border-subtle max-w-full"
                  >
                    <span className="truncate">{recipient}</span>
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeBccRecipient(idx);
                      }}
                      className="text-text-muted hover:text-text-primary transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <div className="flex-1 min-w-[120px] mt-0.5" onClick={(e) => e.stopPropagation()}>
                  <input 
                    ref={bccInputRef}
                    type="text"
                    placeholder={bccRecipients.length === 0 ? "Bcc" : ""}
                    value={bccInputValue}
                    onChange={(e) => setBccInputValue(e.target.value)}
                    onKeyDown={handleBccKeyDown}
                    className="w-full bg-transparent text-[14px] text-text-primary placeholder:text-text-muted outline-none"
                  />
                </div>
              </div>
            </div>
          )}

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
                    onClick={() => enhanceMutation.mutate(undefined)}
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
              onMouseUp={handleMouseUp}
              onKeyUp={handleKeyUp}
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
          <div className="flex flex-col gap-3 px-4 py-3 bg-bg-surface border-t border-border-subtle flex-shrink-0">
            <div className="flex items-center justify-between gap-3">
            <div className="relative shrink-0">
              <div className="flex items-stretch rounded-md overflow-hidden shadow-sm">
                <button 
                  type="button" 
                  onClick={handleSend}
                  disabled={isSending || isSavingDraft}
                  className="flex h-9 min-w-[92px] items-center justify-center px-4 bg-accent-blue hover:bg-accent-blue-dim text-white text-[13px] font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSending ? 'Sending...' : scheduleAt ? `Schedule send` : 'Send'}
                </button>
                <div className="w-[1px] bg-white/20"></div>
                <button 
                  type="button" 
                  onClick={() => setShowScheduleSend(!showScheduleSend)}
                  disabled={isSending || isSavingDraft}
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
            
            <div className="flex flex-wrap items-center justify-between gap-2 text-text-muted">
              <div className="flex items-center gap-2 select-none">
                {draftStatus === 'saving' && (
                  <span className="text-[11px] text-text-muted animate-pulse">Saving draft...</span>
                )}
                {draftStatus === 'saved' && (
                  <span className="text-[11px] text-text-muted">Draft saved</span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Select 
                  value={tone} 
                  onValueChange={(v) => {
                    const newTone = v as ComposeTone;
                    setTone(newTone);
                    if (!draftValue.trim()) {
                      toast.error('Draft is empty');
                      return;
                    }
                    setOriginalDraft(draftValue);
                    enhanceMutation.mutate(newTone);
                  }}
                >
                  <SelectTrigger 
                    className="h-9 w-14 bg-bg-elevated border border-border-subtle rounded-md flex items-center justify-center gap-1 hover:text-text-primary transition-colors cursor-pointer select-none"
                    disabled={enhanceMutation.isPending}
                    title="AI Enhance (Select Tone)"
                  >
                    <Sparkles className={cn("h-4 w-4 text-violet-400", enhanceMutation.isPending && "animate-pulse")} />
                    <span className="hidden">
                      <SelectValue placeholder="Tone" />
                    </span>
                  </SelectTrigger>
                  <SelectContent position="popper" className="z-[1001]">
                    {TONE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <button
                  type="button"
                  onClick={() => setTemplateModalOpen(true)}
                  className="composer-shine-btn relative overflow-hidden h-9 px-3 text-xs font-semibold rounded-md border border-violet-500/35 bg-gradient-to-r from-violet-600/10 to-cyan-600/10 hover:from-violet-600/20 hover:to-cyan-600/20 text-violet-400 hover:text-violet-300 transition-colors shadow-sm cursor-pointer shrink-0"
                >
                  Templates
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
                  title="Attach file"
                >
                  <Paperclip className="h-4 w-4 text-text-muted" />
                </button>

                <Popover>
                  <PopoverTrigger asChild>
                    <button 
                      type="button" 
                      aria-label="More options"
                      className="flex h-9 w-9 items-center justify-center rounded-md border border-border-subtle hover:text-text-primary transition-colors"
                    >
                      <MoreHorizontal className="h-4 w-4 text-text-muted" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-52 p-1.5 flex flex-col gap-1 z-[1000] bg-bg-elevated border border-border-subtle shadow-xl rounded-lg">
                    <button 
                      type="button"
                      onClick={() => setIsHtmlMode((v) => !v)} 
                      className="flex items-center gap-2 px-2.5 py-2 text-xs hover:bg-bg-surface rounded-md text-text-primary text-left font-medium transition-colors"
                    >
                      {isHtmlMode ? 'HTML mode: On' : 'HTML mode: Off'}
                    </button>
                    <button 
                      type="button"
                      onClick={openHtmlPreview} 
                      className="flex items-center gap-2 px-2.5 py-2 text-xs hover:bg-bg-surface rounded-md text-text-primary text-left font-medium transition-colors"
                    >
                      Preview HTML
                    </button>
                    <div className="h-[1px] bg-border-subtle/60 my-0.5"></div>
                    <button 
                      type="button"
                      className="flex items-center gap-2 px-2.5 py-2 text-xs hover:bg-bg-surface rounded-md text-text-primary text-left font-medium transition-colors"
                    >
                      <Code className="h-3.5 w-3.5 text-text-muted" />
                      Insert code
                    </button>
                    <button 
                      type="button"
                      className="flex items-center gap-2 px-2.5 py-2 text-xs hover:bg-bg-surface rounded-md text-text-primary text-left font-medium transition-colors"
                    >
                      <CalendarIcon className="h-3.5 w-3.5 text-text-muted" />
                      Insert calendar event
                    </button>
                    <div className="h-[1px] bg-border-subtle/60 my-0.5"></div>
                    <button 
                      type="button"
                      onPointerDown={(e) => e.preventDefault()}
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleSaveDraft();
                      }}
                      disabled={isSending || isSavingDraft}
                      className="flex items-center gap-2 px-2.5 py-2 text-xs hover:bg-bg-surface rounded-md text-text-primary text-left font-medium transition-colors disabled:opacity-50"
                    >
                      {isSavingDraft ? 'Saving draft...' : 'Save Draft'}
                    </button>
                  </PopoverContent>
                </Popover>
              </div>
              <style>{`
                @keyframes composer-shine {
                  0% { transform: translateX(-150%); }
                  50% { transform: translateX(150%); }
                  100% { transform: translateX(150%); }
                }
                .composer-shine-btn::after {
                  content: '';
                  position: absolute;
                  top: 0; left: 0; width: 100%; height: 100%;
                  background: linear-gradient(90deg, transparent, rgba(167, 139, 250, 0.25), transparent);
                  transform: translateX(-150%);
                  animation: composer-shine 4s infinite ease-in-out;
                }
              `}</style>
            </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>

    {floatingMenuCoords && (
      <div 
        style={{ 
          left: `${floatingMenuCoords.x}px`, 
          top: `${floatingMenuCoords.y}px`,
          transform: 'translate(-50%, -100%)'
        }}
        className="floating-format-menu fixed z-[2000] flex items-center gap-1 bg-bg-elevated border border-border-subtle shadow-xl rounded-lg p-1 animate-in fade-in slide-in-from-bottom-2 duration-150"
      >
        <button
          type="button"
          onClick={() => applyFormat('bold')}
          className="flex h-7 w-7 items-center justify-center text-text-primary hover:bg-bg-surface rounded transition-colors"
          title="Bold"
        >
          <Bold className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => applyFormat('italic')}
          className="flex h-7 w-7 items-center justify-center text-text-primary hover:bg-bg-surface rounded transition-colors"
          title="Italic"
        >
          <Italic className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => applyFormat('underline')}
          className="flex h-7 w-7 items-center justify-center text-text-primary hover:bg-bg-surface rounded transition-colors"
          title="Underline"
        >
          <Underline className="h-3.5 w-3.5" />
        </button>
        <div className="w-[1px] h-4 bg-border-subtle mx-1"></div>
        <button
          type="button"
          onClick={handleEnhanceSelection}
          disabled={isEnhancingSelection}
          className="flex h-7 px-2 items-center gap-1 text-[11px] font-semibold text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 rounded transition-colors disabled:opacity-50"
        >
          <Sparkles className="h-3 w-3" />
          {isEnhancingSelection ? 'Enhancing...' : 'AI Enhance'}
        </button>
      </div>
    )}

    <TemplatePickerModal
      open={templateModalOpen}
      onOpenChange={setTemplateModalOpen}
      onInject={({ subject: tplSubject, htmlContent }) => {
        if (tplSubject.trim()) setSubject(tplSubject);
        setHtmlBody(htmlContent);
        setIsHtmlMode(true);
        setEnhancedDraft(null);
        setOriginalDraft(null);
      }}
    />
    </>
  );
}
