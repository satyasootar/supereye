'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils';

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
  className?: string;
  size?: 'sm' | 'md';
}

export function AiBot({
  openAgentOnClick = true,
  hideWhenAgentOpen = true,
  disableClick = false,
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

  const triggerEmotion = useCallback((newEmotion: Emotion, duration: number) => {
    if (emotionTimeoutRef.current) clearTimeout(emotionTimeoutRef.current);
    
    setEmotion({ type: newEmotion, intensity: 1, triggeredAt: Date.now() });
    stateRef.current.emotion = newEmotion;
    
    emotionTimeoutRef.current = setTimeout(() => {
      setEmotion(prev => ({ ...prev, type: 'neutral', intensity: 0 }));
      stateRef.current.emotion = 'neutral';
    }, duration);
  }, []);

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
      className={cn(
        'select-none transition-transform duration-300',
        disableClick ? 'cursor-default' : 'cursor-pointer hover:scale-105',
        openAgentOnClick ? 'fixed bottom-6 right-6 z-[100]' : 'relative z-0',
        className
      )}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      title={openAgentOnClick ? 'Open AI Assistant' : 'supereye'}
      ref={containerRef}
    >
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