'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store/app-store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import type { BotSettings } from '@/lib/plugins/types';
import { DEFAULT_BOT_SETTINGS } from '@/lib/plugins/types';
import { TOUR_TARGETS } from '@/lib/tour/targets';

type Emotion = 
  | 'neutral' 
  | 'happy' 
  | 'angry' 
  | 'surprised' 
  | 'sleepy' 
  | 'blushing' 
  | 'dizzy' 
  | 'scared' 
  | 'lovestruck' 
  | 'winking';

interface EmotionState {
  type: Emotion;
  intensity: number;
  triggeredAt: number;
}

interface AiBotProps {
  /** Opens the agent overlay on click. Default true for workspace FAB. */
  openAgentOnClick?: boolean;
  /** Hides the bot while the agent is open. Default true for workspace FAB. */
  hideWhenAgentOpen?: boolean;
  /** Disables all click handling (no agent open, no click emotions). */
  disableClick?: boolean;
  /** Allows parent to trigger emotions via callback ref */
  onEmotionRef?: (trigger: (emotion: Emotion, duration: number) => void) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export type { Emotion };

export const SHORTCUT_TIPS = [
  "Tip: Press Tab to switch plugins (Email/Calendar) in your workspace!",
  "Tip: Press D at any time to toggle between Light and Dark mode.",
  "Tip: Press Ctrl+K (or Cmd+K) to open the Command Palette.",
  "Tip: Press j and k to move down and up in your email list.",
  "Tip: Press Ctrl+J to toggle eye open/closed.",
  "Tip: Press t in the Calendar view to jump back to Today.",
];

export function AiBot({
  openAgentOnClick = true,
  hideWhenAgentOpen = true,
  disableClick = false,
  onEmotionRef,
  className,
  size = 'md',
}: AiBotProps = {}) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [emotion, setEmotion] = useState<EmotionState>({ 
    type: 'neutral', 
    intensity: 0, 
    triggeredAt: 0 
  });
  
  const stateRef = useRef({
    isHovered: false,
    clickCount: 0,
    emotion: 'neutral' as Emotion,
    lastMouseTime: Date.now()
  });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const lastMouseRef = useRef({ x: 0, y: 0, time: Date.now() });
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const emotionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const setAgentOpen = useAppStore(state => state.setAgentOpen);
  const isAgentOpen = useAppStore(state => state.isAgentOpen);
  const queryClient = useQueryClient();

  const triggerEmotion = useCallback((newEmotion: Emotion, duration: number) => {
    if (emotionTimeoutRef.current) clearTimeout(emotionTimeoutRef.current);
    
    setEmotion({ type: newEmotion, intensity: 1, triggeredAt: Date.now() });
    stateRef.current.emotion = newEmotion;
    
    emotionTimeoutRef.current = setTimeout(() => {
      setEmotion(prev => ({ ...prev, type: 'neutral', intensity: 0 }));
      stateRef.current.emotion = 'neutral';
    }, duration);
  }, []);

  // Expose triggerEmotion to parent via callback ref
  useEffect(() => {
    if (onEmotionRef) onEmotionRef(triggerEmotion);
  }, [onEmotionRef, triggerEmotion]);

  const [showBubble, setShowBubble] = useState(false);
  const [bubbleText, setBubbleText] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [bubbleMode, setBubbleMode] = useState<'welcome' | 'tip'>('welcome');
  const [tipIndex, setTipIndex] = useState(0);
  const [showTipConfirm, setShowTipConfirm] = useState(false);

  const WELCOME_STEPS = [
    "Hey! I am eye.",
    "I can help you with sending emails,",
    "creating calendar events, and more!"
  ];

  // ── Fetch bot settings from user preferences ──────────────────────
  const { data: prefData } = useQuery({
    queryKey: ['user', 'preferences'],
    queryFn: async () => {
      const res = await fetch('/api/user/preferences');
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 60_000,
    enabled: openAgentOnClick,
  });

  const botSettings: BotSettings = (prefData?.botSettings as BotSettings) ?? DEFAULT_BOT_SETTINGS;

  const updateBotSettings = useMutation({
    mutationFn: async (patch: Partial<BotSettings>) => {
      const res = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botSettings: patch }),
      });
      if (!res.ok) throw new Error('Failed to update');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'preferences'] });
    },
  });

  // Welcome flow trigger
  useEffect(() => {
    if (!openAgentOnClick) return;
    const dismissed = localStorage.getItem('eye-welcome-dismissed') === 'true';
    if (dismissed) return;

    const timer = setTimeout(() => {
      setBubbleMode('welcome');
      setCurrentStep(0);
      setShowBubble(true);
      triggerEmotion('happy', 1500);
    }, 1500);

    return () => clearTimeout(timer);
  }, [openAgentOnClick, triggerEmotion]);

  // If agent opens, hide and dismiss welcome
  useEffect(() => {
    if (isAgentOpen) {
      setShowBubble(false);
      localStorage.setItem('eye-welcome-dismissed', 'true');
    }
  }, [isAgentOpen]);

  // Typing and transition orchestration
  useEffect(() => {
    if (!showBubble) return;

    const fullMessage = bubbleMode === 'welcome'
      ? (WELCOME_STEPS[currentStep] || '')
      : (SHORTCUT_TIPS[tipIndex] || '');

    let currentText = '';
    let i = 0;
    let transitionTimer: NodeJS.Timeout | null = null;
    let nextStepTimer: NodeJS.Timeout | null = null;

    const interval = setInterval(() => {
      if (i < fullMessage.length) {
        currentText += fullMessage[i];
        setBubbleText(currentText);
        i++;
      } else {
        clearInterval(interval);
        
        if (bubbleMode === 'welcome') {
          // Welcome flow: auto-advance after 2s
          transitionTimer = setTimeout(() => {
            setShowBubble(false);

            nextStepTimer = setTimeout(() => {
              const nextStep = currentStep + 1;
              const dismissed = localStorage.getItem('eye-welcome-dismissed') === 'true';
              
              if (nextStep < WELCOME_STEPS.length && !dismissed && !isAgentOpen) {
                setCurrentStep(nextStep);
                setShowBubble(true);
                if (nextStep === 1) {
                  triggerEmotion('happy', 1500);
                } else if (nextStep === 2) {
                  triggerEmotion('winking', 1500);
                }
              } else if (nextStep >= WELCOME_STEPS.length) {
                localStorage.setItem('eye-welcome-dismissed', 'true');
              }
            }, 800);
          }, 2000);
        } else if (bubbleMode === 'tip' && botSettings.autoCloseTips) {
          // Auto-close tips only if setting is enabled
          transitionTimer = setTimeout(() => {
            setShowBubble(false);
          }, botSettings.autoCloseDelay);
        }
        // If autoCloseTips is false, tips stay until user clicks ✕
      }
    }, 25);

    return () => {
      clearInterval(interval);
      if (transitionTimer) clearTimeout(transitionTimer);
      if (nextStepTimer) clearTimeout(nextStepTimer);
    };
  }, [showBubble, currentStep, tipIndex, bubbleMode, isAgentOpen, triggerEmotion, botSettings.autoCloseTips, botSettings.autoCloseDelay]);

  // Periodic tips trigger — only if showTips is enabled
  useEffect(() => {
    if (!openAgentOnClick || !botSettings.showTips) return;

    const checkAndStartTips = () => {
      const intervalId = setInterval(() => {
        const dismissed = localStorage.getItem('eye-welcome-dismissed') === 'true';
        if (!dismissed) return;

        if (!showBubble && !isAgentOpen) {
          setTipIndex((prev) => (prev + 1) % SHORTCUT_TIPS.length);
          setBubbleMode('tip');
          setShowBubble(true);
          triggerEmotion(Math.random() > 0.5 ? 'winking' : 'happy', 1500);
        }
      }, 60000); // 60s

      return intervalId;
    };

    let activeInterval: NodeJS.Timeout | null = null;
    const pollTimer = setInterval(() => {
      const welcomeDismissed = localStorage.getItem('eye-welcome-dismissed') === 'true';
      if (welcomeDismissed) {
        clearInterval(pollTimer);
        const id = checkAndStartTips();
        if (id) activeInterval = id;
      }
    }, 2000);

    return () => {
      clearInterval(pollTimer);
      if (activeInterval) clearInterval(activeInterval);
    };
  }, [openAgentOnClick, showBubble, isAgentOpen, triggerEmotion, botSettings.showTips]);

  const handleDismissBubble = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (bubbleMode === 'welcome') {
      setShowBubble(false);
      localStorage.setItem('eye-welcome-dismissed', 'true');
    } else {
      // For tips: show confirmation popover
      setShowTipConfirm(true);
    }
  };

  const handleTipConfirmYes = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowTipConfirm(false);
    setShowBubble(false);
    // Keep showTips true — tips will continue
  };

  const handleTipConfirmNo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowTipConfirm(false);
    setShowBubble(false);
    // Disable tips permanently
    updateBotSettings.mutate({ showTips: false });
  };

  const handleBubbleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowBubble(false);
    setShowTipConfirm(false);
    if (bubbleMode === 'welcome') {
      localStorage.setItem('eye-welcome-dismissed', 'true');
    }
    setAgentOpen(true);
  };

  // Track mouse position and velocity for surprise/scared detection
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      const dt = Math.max(now - lastMouseRef.current.time, 1);
      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;
      const speed = Math.hypot(dx, dy) / dt * 100;

      setMousePosition({ x: e.clientX, y: e.clientY });
      stateRef.current.lastMouseTime = now;
      
      lastMouseRef.current = { x: e.clientX, y: e.clientY, time: now };

      if (containerRef.current && speed > 80) {
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const distToBot = Math.hypot(e.clientX - centerX, e.clientY - centerY);
        const prevDistToBot = Math.hypot(lastMouseRef.current.x - centerX, lastMouseRef.current.y - centerY);
        
        // Darts toward bot
        if (distToBot < prevDistToBot && distToBot < 200) {
          triggerEmotion('scared', 1000);
        } else if (speed > 120) {
          triggerEmotion('surprised', 1000);
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [triggerEmotion]);

  // Idle tracking - becomes sleepy
  useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() - stateRef.current.lastMouseTime > 5000) {
        if (stateRef.current.emotion === 'neutral') {
          triggerEmotion('sleepy', 3000);
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [triggerEmotion]);

  // Dizzy when mouse circles around the bot
  useEffect(() => {
    if (!containerRef.current) return;
    
    let angleHistory: number[] = [];
    const checkCircles = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = mousePosition.x - centerX;
      const dy = mousePosition.y - centerY;
      const dist = Math.hypot(dx, dy);
      
      if (dist < 150 && dist > 40) {
        const angle = Math.atan2(dy, dx);
        angleHistory.push(angle);
        if (angleHistory.length > 20) angleHistory.shift();
        
        let totalRotation = 0;
        for (let i = 1; i < angleHistory.length; i++) {
          let diff = angleHistory[i] - angleHistory[i-1];
          if (diff > Math.PI) diff -= 2 * Math.PI;
          if (diff < -Math.PI) diff += 2 * Math.PI;
          totalRotation += diff;
        }
        
        if (Math.abs(totalRotation) > Math.PI * 1.5) {
          triggerEmotion('dizzy', 2000);
          angleHistory = [];
        }
      } else {
        angleHistory = [];
      }
    };
    
    const interval = setInterval(checkCircles, 50);
    return () => clearInterval(interval);
  }, [mousePosition, triggerEmotion]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (disableClick) return;

    e.stopPropagation();
    
    stateRef.current.clickCount += 1;
    const currentClicks = stateRef.current.clickCount;
    
    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    
    if (currentClicks === 1) {
      clickTimeoutRef.current = setTimeout(() => {
        if (stateRef.current.clickCount === 1) {
          triggerEmotion('happy', 1500);
        } else if (stateRef.current.clickCount === 2) {
          triggerEmotion('winking', 1000);
        }
        stateRef.current.clickCount = 0;
      }, 300);
    } else if (currentClicks >= 3) {
      triggerEmotion('angry', 2000);
      stateRef.current.clickCount = 0;
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    }
    
    if (openAgentOnClick) {
      setAgentOpen(true);
    }
  }, [triggerEmotion, setAgentOpen, openAgentOnClick, disableClick]);

  const handleMouseEnter = useCallback(() => {
    stateRef.current.isHovered = true;
    
    // Short hover = blushing
    setTimeout(() => {
      if (stateRef.current.isHovered && stateRef.current.emotion === 'neutral') {
        triggerEmotion('blushing', 3000);
      }
    }, 300);
    
    // Long hover = lovestruck
    setTimeout(() => {
      if (stateRef.current.isHovered && stateRef.current.emotion === 'blushing') {
        triggerEmotion('lovestruck', 3000);
      }
    }, 2000);
  }, [triggerEmotion]);

  const handleMouseLeave = useCallback(() => {
    stateRef.current.isHovered = false;
  }, []);

  // Calculate eye/pupil position based on mouse
  let moveX = 0;
  let moveY = 0;
  
  if (containerRef.current) {
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const angle = Math.atan2(mousePosition.y - centerY, mousePosition.x - centerX);
    const rawDistance = Math.hypot(mousePosition.x - centerX, mousePosition.y - centerY);
    const maxDistance = 14;
    const distance = Math.min(rawDistance / 15, maxDistance);
    
    if (emotion.type === 'lovestruck') {
      const loveDistance = Math.min(distance * 0.3, 5);
      moveX = Math.cos(angle) * loveDistance;
      moveY = Math.sin(angle) * loveDistance;
    } else if (emotion.type === 'scared') {
      moveX = -Math.cos(angle) * 8;
      moveY = -Math.sin(angle) * 8;
    } else if (emotion.type === 'dizzy') {
      const time = Date.now() / 200;
      moveX = Math.sin(time) * 10;
      moveY = Math.cos(time) * 6;
    } else if (emotion.type === 'sleepy') {
      moveX = Math.cos(angle) * distance * 0.5;
      moveY = Math.sin(angle) * distance * 0.5 + 4;
    } else {
      moveX = Math.cos(angle) * distance;
      moveY = Math.sin(angle) * distance;
    }
  }

  // Emotion configurations for eye geometry
  const getEyeConfig = () => {
    const base = { scaleX: 1, scaleY: 1, rotate: 0, yOffset: 0, rx: 6 };
    
    switch (emotion.type) {
      case 'happy':
        return { ...base, scaleY: 0.4, scaleX: 1.1, yOffset: 6, rx: 10 };
      case 'angry':
        return { ...base, scaleY: 0.6, scaleX: 0.9, rotate: 20, rx: 2, yOffset: 2 };
      case 'surprised':
        return { ...base, scaleY: 1.3, scaleX: 1.2, rx: 10, yOffset: -2 };
      case 'sleepy':
        return { ...base, scaleY: 0.3, yOffset: 8, rx: 2 };
      case 'blushing':
        return { ...base, scaleY: 0.8, scaleX: 1.1, yOffset: 2 };
      case 'dizzy':
        return { ...base, scaleY: 0.9, scaleX: 1.3, rx: 10, rotate: 15 };
      case 'scared':
        return { ...base, scaleY: 1.2, scaleX: 0.5, yOffset: -3, rx: 4 };
      case 'lovestruck':
        return { ...base, scaleY: 1.2, scaleX: 1.2, rx: 10, yOffset: -1 };
      case 'winking':
        return { 
          left: { ...base, scaleY: 0.1, yOffset: 10, rx: 6 }, 
          right: { ...base, scaleY: 1.1, scaleX: 1.1, yOffset: 0, rotate: 0, rx: 6 } 
        };
      default:
        return base;
    }
  };

  const eyeConfig = getEyeConfig() as any;
  const isWinking = emotion.type === 'winking';
  const isBlushing = emotion.type === 'blushing' || emotion.type === 'lovestruck';
  const isAngry = emotion.type === 'angry';

  if (hideWhenAgentOpen && isAgentOpen) return null;

  const sizeClass = size === 'sm' ? 'h-8 w-8' : 'h-14 w-14';

  return (
    <div 
      data-tour={openAgentOnClick ? TOUR_TARGETS.eye : undefined}
      className={cn(
        'select-none transition-transform duration-300',
        disableClick ? 'cursor-default' : 'cursor-pointer hover:scale-105',
        openAgentOnClick ? 'fixed bottom-6 right-6 z-[100]' : 'relative z-0',
        className
      )}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      title={openAgentOnClick ? 'Open eye' : 'eye'}
      ref={containerRef}
    >
      <AnimatePresence>
        {showBubble && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 20 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="absolute bottom-2 right-[72px] w-[280px] rounded-xl border border-border-default bg-card/95 backdrop-blur-md p-3.5 shadow-lg cursor-pointer select-none text-left group/bubble"
            onClick={handleBubbleClick}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={handleDismissBubble}
              className="absolute top-2 right-2 p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-highlight/50 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>

            {/* Bubble contents */}
            <div className="pr-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-accent-blue block mb-1">
                {bubbleMode === 'welcome' ? 'eye' : "eye's tip"}
              </span>
              <p className="text-[12.5px] leading-relaxed text-text-primary font-medium min-h-[3.5em]">
                {bubbleText}
                {bubbleText.length < (bubbleMode === 'welcome' ? (WELCOME_STEPS[currentStep]?.length || 0) : (SHORTCUT_TIPS[tipIndex]?.length || 0)) && (
                  <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-accent-blue animate-pulse align-middle" />
                )}
              </p>
            </div>

            {/* Tip confirmation popover */}
            <AnimatePresence>
              {showTipConfirm && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.15 }}
                  className="mt-3 pt-3 border-t border-border-subtle"
                >
                  <p className="text-[11px] text-text-secondary mb-2">
                    Want to keep seeing tips?
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleTipConfirmYes}
                      className="flex-1 rounded-md border border-border-default bg-bg-surface px-3 py-1.5 text-[11px] font-semibold text-text-primary transition-colors hover:bg-bg-highlight"
                    >
                      Yes, keep tips
                    </button>
                    <button
                      type="button"
                      onClick={handleTipConfirmNo}
                      className="flex-1 rounded-md bg-accent-blue px-3 py-1.5 text-[11px] font-semibold text-text-inverse transition-colors hover:bg-accent-blue-dim"
                    >
                      No, stop tips
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Speech bubble arrow */}
            <div className="absolute right-[-5px] bottom-5 w-2.5 h-2.5 bg-card border-r border-t border-border-default rotate-[45deg]" />
          </motion.div>
        )}
      </AnimatePresence>

      <svg 
        viewBox="0 0 100 100" 
        fill="none" 
        className={cn(sizeClass, 'text-white dark:text-black')}
        stroke="currentColor" 
        strokeWidth="3"
      >
        {/* Outer Face */}
        <circle cx="50" cy="50" r="46" className="fill-black dark:fill-white" />
        
        {/* Angry eyebrows */}
        {isAngry && (
          <motion.g
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <line x1="28" y1="32" x2="42" y2="38" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            <line x1="72" y1="32" x2="58" y2="38" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </motion.g>
        )}

        {/* Blushing cheeks */}
        {isBlushing && (
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
          >
            <circle cx="22" cy="55" r="8" className="fill-rose-400 dark:fill-rose-500" stroke="none" opacity="0.5" />
            <circle cx="78" cy="55" r="8" className="fill-rose-400 dark:fill-rose-500" stroke="none" opacity="0.5" />
          </motion.g>
        )}

        {/* Love hearts for lovestruck */}
        {emotion.type === 'lovestruck' && (
          <motion.g
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
          >
            <path 
              d="M22 48 C22 44, 18 42, 16 45 C14 42, 10 44, 10 48 C10 52, 16 58, 16 58 C16 58, 22 52, 22 48Z" 
              className="fill-rose-500" 
              stroke="none"
            />
            <path 
              d="M90 48 C90 44, 86 42, 84 45 C82 42, 78 44, 78 48 C78 52, 84 58, 84 58 C84 58, 90 52, 90 48Z" 
              className="fill-rose-500" 
              stroke="none"
            />
          </motion.g>
        )}

        {/* Inner Eyes that track cursor */}
        <motion.g 
          animate={{ x: moveX, y: moveY }}
          transition={{ type: "spring", stiffness: emotion.type === 'sleepy' ? 100 : 200, damping: 20, mass: 0.5 }}
        >
          {/* Blinking Group - disabled during emotions except neutral */}
          <motion.g
            animate={{ 
              scaleY: emotion.type === 'neutral' ? [1, 1, 1, 0.1, 1, 1] : 1 
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              times: [0, 0.9, 0.93, 0.95, 0.97, 1]
            }}
            style={{ transformOrigin: '50px 50px' }}
          >
            {/* Left Eye */}
            <motion.rect 
              x="35" 
              y="38" 
              width="8" 
              height="24" 
              rx={isWinking ? (eyeConfig as any).left?.rx || 6 : eyeConfig.rx} 
              className="fill-current"
              animate={{
                scaleX: isWinking ? (eyeConfig as any).left?.scaleX || 1 : eyeConfig.scaleX,
                scaleY: isWinking ? (eyeConfig as any).left?.scaleY || 1 : eyeConfig.scaleY,
                rotate: isWinking ? (eyeConfig as any).left?.rotate || 0 : eyeConfig.rotate,
                y: isWinking ? (eyeConfig as any).left?.yOffset || 0 : eyeConfig.yOffset || 0,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              style={{ transformOrigin: '39px 50px' }}
            />
            
            {/* Right Eye */}
            <motion.rect 
              x="57" 
              y="38" 
              width="8" 
              height="24" 
              rx={isWinking ? (eyeConfig as any).right?.rx || 6 : eyeConfig.rx} 
              className="fill-current"
              animate={{
                scaleX: isWinking ? (eyeConfig as any).right?.scaleX || 1 : eyeConfig.scaleX,
                scaleY: isWinking ? (eyeConfig as any).right?.scaleY || 1 : eyeConfig.scaleY,
                rotate: isWinking ? -((eyeConfig as any).right?.rotate || 0) : -eyeConfig.rotate,
                y: isWinking ? (eyeConfig as any).right?.yOffset || 0 : eyeConfig.yOffset || 0,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              style={{ transformOrigin: '61px 50px' }}
            />
          </motion.g>
        </motion.g>

        {/* Sleepy Zzz animation */}
        {emotion.type === 'sleepy' && (
          <motion.g
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: [0, 1, 0], y: -20, x: 10 }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
          >
            <text x="70" y="30" fill="currentColor" fontSize="14" fontWeight="bold" className="text-white dark:text-black">Z</text>
          </motion.g>
        )}

        {/* Angry frustration marks */}
        {emotion.type === 'angry' && (
          <motion.g
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: [1, 1.2, 1] }}
            transition={{ duration: 0.3, repeat: 2 }}
          >
            <path d="M20 25 L24 20 M80 25 L76 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </motion.g>
        )}
      </svg>
    </div>
  );
}