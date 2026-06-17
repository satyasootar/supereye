'use client';

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProfileSection, ProfileRow } from '@/components/profile/profile-section';
import { AiBot, SHORTCUT_TIPS } from '@/components/os/ai-bot';
import type { Emotion } from '@/components/os/ai-bot';
import type { BotSettings } from '@/lib/plugins/types';
import { DEFAULT_BOT_SETTINGS } from '@/lib/plugins/types';
import { cn } from '@/lib/utils';
import {
  Lightbulb,
  Sparkles,
} from 'lucide-react';

const EMOTION_DETAILS: { emotion: Emotion; label: string; trigger: string; color: string }[] = [
  { emotion: 'neutral', label: 'Neutral', trigger: 'Default idle state', color: 'bg-gray-400/20 text-gray-500 border-gray-400/30' },
  { emotion: 'happy', label: 'Happy', trigger: 'Single-click the bot', color: 'bg-yellow-400/20 text-yellow-600 border-yellow-400/30 dark:text-yellow-400' },
  { emotion: 'winking', label: 'Winking', trigger: 'Double-click the bot', color: 'bg-purple-400/20 text-purple-600 border-purple-400/30 dark:text-purple-400' },
  { emotion: 'angry', label: 'Angry', trigger: 'Triple-click rapidly', color: 'bg-red-400/20 text-red-600 border-red-400/30 dark:text-red-400' },
  { emotion: 'surprised', label: 'Surprised', trigger: 'Move mouse very fast nearby', color: 'bg-amber-400/20 text-amber-600 border-amber-400/30 dark:text-amber-400' },
  { emotion: 'scared', label: 'Scared', trigger: 'Dart mouse quickly toward the bot', color: 'bg-cyan-400/20 text-cyan-600 border-cyan-400/30 dark:text-cyan-400' },
  { emotion: 'dizzy', label: 'Dizzy', trigger: 'Circle mouse around the bot', color: 'bg-indigo-400/20 text-indigo-600 border-indigo-400/30 dark:text-indigo-400' },
  { emotion: 'sleepy', label: 'Sleepy', trigger: 'Leave mouse idle for 5+ seconds', color: 'bg-blue-400/20 text-blue-600 border-blue-400/30 dark:text-blue-400' },
  { emotion: 'blushing', label: 'Blushing', trigger: 'Hover over the bot briefly', color: 'bg-pink-400/20 text-pink-600 border-pink-400/30 dark:text-pink-400' },
  { emotion: 'lovestruck', label: 'Lovestruck', trigger: 'Hover over the bot for 2+ seconds', color: 'bg-rose-400/20 text-rose-600 border-rose-400/30 dark:text-rose-400' },
];

export function BotSettingsSection() {
  const queryClient = useQueryClient();
  const [triggerFn, setTriggerFn] = useState<((emotion: Emotion, duration: number) => void) | null>(null);
  const [activeEmotion, setActiveEmotion] = useState<Emotion>('neutral');
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const { data: prefData } = useQuery({
    queryKey: ['user', 'preferences'],
    queryFn: async () => {
      const res = await fetch('/api/user/preferences');
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 60_000,
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

  const handleEmotionRefCallback = useCallback((trigger: (emotion: Emotion, duration: number) => void) => {
    setTriggerFn(() => trigger);
  }, []);

  const handleEmotionClick = (emotion: Emotion) => {
    setActiveEmotion(emotion);
    if (triggerFn) {
      triggerFn(emotion, 3000);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* About Eye */}
      <ProfileSection
        title="About eye"
        description="eye is your AI assistant built into Supereye. It helps you compose emails, schedule meetings, and navigate your workspace — all through natural conversation."
      >
        <div className="flex items-start gap-4 rounded-[var(--radius)] border border-border-subtle bg-bg-elevated/50 p-4">
          <div className="shrink-0 pt-1">
            <AiBot
              openAgentOnClick={false}
              hideWhenAgentOpen={false}
              disableClick
              size="sm"
              className="!fixed-none !relative !z-0 !bottom-auto !right-auto"
            />
          </div>
          <div className="space-y-2">
            <p className="text-[13px] font-medium text-text-primary">
              Eye has emotions!
            </p>
            <p className="text-[12px] leading-relaxed text-text-muted">
              Eye reacts to how you interact with it. Move your mouse, hover,
              click, and circle around the bot to see different facial expressions.
              Try the emotion playground below to see all reactions.
            </p>
          </div>
        </div>
      </ProfileSection>

      {/* Tip Settings */}
      <ProfileSection
        title="Tip settings"
        description="Control how Eye shares tips and shortcuts with you."
      >
        <ProfileRow
          label="Show tips"
          description="Eye periodically shares keyboard shortcuts and productivity tips"
        >
          <button
            type="button"
            role="switch"
            aria-checked={mounted ? botSettings.showTips : true}
            onClick={() => updateBotSettings.mutate({ showTips: !botSettings.showTips })}
            className={cn(
              'relative h-6 w-11 rounded-full transition-colors',
              mounted && botSettings.showTips ? 'bg-accent-blue' : 'bg-bg-overlay'
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
                mounted && botSettings.showTips && 'translate-x-5'
              )}
            />
          </button>
        </ProfileRow>

        <ProfileRow
          label="Auto-close tips"
          description={`Tips will automatically dismiss after ${(botSettings.autoCloseDelay / 1000).toFixed(0)}s. If off, tips stay until you close them.`}
        >
          <button
            type="button"
            role="switch"
            aria-checked={mounted ? botSettings.autoCloseTips : false}
            onClick={() => updateBotSettings.mutate({ autoCloseTips: !botSettings.autoCloseTips })}
            className={cn(
              'relative h-6 w-11 rounded-full transition-colors',
              mounted && botSettings.autoCloseTips ? 'bg-accent-blue' : 'bg-bg-overlay'
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
                mounted && botSettings.autoCloseTips && 'translate-x-5'
              )}
            />
          </button>
        </ProfileRow>

        {/* Tips list */}
        <div className="mt-2">
          <h4 className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            <Lightbulb className="h-3.5 w-3.5" />
            All tips Eye knows
          </h4>
          <ul className="space-y-1.5">
            {SHORTCUT_TIPS.map((tip, i) => (
              <li
                key={i}
                className="flex items-start gap-2 rounded-md border border-border-subtle bg-bg-surface/60 px-3 py-2 text-[12px] text-text-secondary"
              >
                <span className="mt-0.5 shrink-0 text-accent-blue font-bold">{i + 1}.</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </ProfileSection>

      {/* Emotion Playground */}
      <ProfileSection
        title="Emotion playground"
        description="Click any emotion below to see Eye react. These same reactions happen naturally as you interact with the bot in the workspace."
      >
        <div className="flex flex-col items-center gap-6">
          {/* Bot preview */}
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-2xl border border-border-subtle bg-bg-elevated/80 p-6">
              <AiBot
                openAgentOnClick={false}
                hideWhenAgentOpen={false}
                disableClick
                onEmotionRef={handleEmotionRefCallback}
                size="md"
                className="!fixed-none !relative !z-0 !bottom-auto !right-auto"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-accent-blue" />
              <span className="text-[12px] font-semibold text-text-primary capitalize">
                {activeEmotion}
              </span>
            </div>
          </div>

          {/* Emotion buttons grid */}
          <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3">
            {EMOTION_DETAILS.map(({ emotion, label, trigger, color }) => (
              <button
                key={emotion}
                type="button"
                onClick={() => handleEmotionClick(emotion)}
                className={cn(
                  'flex flex-col items-start gap-0.5 rounded-lg border px-3 py-2.5 text-left transition-all hover:scale-[1.02] active:scale-[0.98]',
                  activeEmotion === emotion
                    ? `${color} shadow-sm ring-1 ring-accent-blue/30`
                    : 'border-border-subtle bg-bg-surface/60 text-text-secondary hover:bg-bg-highlight/50'
                )}
              >
                <span className="text-[12px] font-semibold">{label}</span>
                <span className="text-[10px] opacity-70 leading-tight">{trigger}</span>
              </button>
            ))}
          </div>
        </div>
      </ProfileSection>
    </div>
  );
}
