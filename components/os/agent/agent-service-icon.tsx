'use client';

import type { AgentAction } from '@/lib/store/app-store';
import { PluginBrandIcon } from '@/components/onboarding/plugin-brand-icon';
import { cn } from '@/lib/utils';

export type AgentServiceId = 'email' | 'calendar' | 'github' | 'drive';

export function AgentServiceIcon({
  service,
  size = 16,
  className,
  framed = false,
}: {
  service: AgentServiceId;
  size?: number;
  className?: string;
  /** Light rounded background behind the icon */
  framed?: boolean;
}) {
  const icon = (
    <PluginBrandIcon
      pluginId={service}
      size={size}
      className={cn('object-contain', className)}
    />
  );

  if (!framed) return icon;

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-md bg-bg-surface',
        size <= 16 ? 'h-7 w-7' : size <= 20 ? 'h-8 w-8' : 'h-9 w-9'
      )}
    >
      {icon}
    </span>
  );
}

export function resolveActionService(action: AgentAction): AgentServiceId | null {
  let type = action.type;
  if (type === 'generic') {
    const tool = action.payload?.toolName?.toLowerCase() ?? '';
    if (tool.includes('github') || tool.includes('git_')) type = 'github_action';
    else if (tool.includes('drive') || tool.includes('google_drive')) type = 'drive_action';
  }

  switch (type) {
    case 'email_draft':
    case 'email_send':
      return 'email';
    case 'calendar_schedule':
      return 'calendar';
    case 'github_action':
      return 'github';
    case 'drive_action':
      return 'drive';
    case 'generic': {
      const tool = action.payload?.toolName?.toLowerCase() ?? '';
      if (tool.includes('gmail') || tool.includes('email') || tool.includes('mail')) {
        return 'email';
      }
      if (tool.includes('calendar')) return 'calendar';
      if (tool.includes('github') || tool.includes('git_')) return 'github';
      if (tool.includes('drive') || tool.includes('googledrive')) return 'drive';
      return null;
    }
    default:
      return null;
  }
}

export function resolveContextService(workspaceMode: string): AgentServiceId {
  if (workspaceMode === 'calendar') return 'calendar';
  if (workspaceMode === 'github') return 'github';
  if (workspaceMode === 'drive') return 'drive';
  return 'email';
}
