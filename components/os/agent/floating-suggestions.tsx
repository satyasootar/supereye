'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useAppStore } from '@/lib/store/app-store';
import { AGENT_SAMPLE_GROUPS, fillAgentInput } from '@/lib/agent/sample-prompts';
import { PluginBrandIcon } from '@/components/onboarding/plugin-brand-icon';
import { cn } from '@/lib/utils';

const spring = { type: 'spring' as const, stiffness: 220, damping: 28 };

export function FloatingSuggestions() {
  const { agentMessages, isAgentExecuting } = useAppStore();

  if (agentMessages.length > 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: 0.12 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-accent-blue" />
        <p className="text-[12px] font-medium uppercase tracking-wider text-text-muted">
          Try a sample action
        </p>
      </div>

      <div className="grid gap-3">
        {AGENT_SAMPLE_GROUPS.map((group, groupIdx) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.08 + groupIdx * 0.06 }}
              className="rounded-xl border border-border-subtle bg-bg-elevated/80 p-3.5 shadow-sm"
            >
              <div className="mb-2.5 flex items-start gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-bg-surface">
                  <PluginBrandIcon pluginId={group.iconPluginId} size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-text-primary">{group.label}</p>
                  <p className="text-[12px] text-text-muted">{group.description}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {group.samples.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    disabled={isAgentExecuting}
                    title={sample.prompt}
                    onClick={() => fillAgentInput(sample.prompt)}
                    className={cn(
                      'group rounded-lg border border-border-subtle bg-bg-surface px-3 py-2 text-left transition-all',
                      'hover:border-accent-blue/30 hover:bg-bg-highlight/50 disabled:opacity-40'
                    )}
                  >
                    <span className="block text-[13px] font-medium text-text-primary group-hover:text-accent-blue">
                      {sample.label}
                    </span>
                    {sample.hint && (
                      <span className="mt-0.5 block text-[11px] text-text-muted">{sample.hint}</span>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
        ))}
      </div>

      <p className="text-[11px] text-text-muted">
        Click any sample to fill the chat box — edit it or press send when ready.
      </p>
    </motion.div>
  );
}
