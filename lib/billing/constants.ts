function parseSuperAdminEmailsFromSources(
  ...sources: (string | undefined)[]
): string[] {
  const emails = new Set<string>();

  for (const source of sources) {
    if (!source) continue;
    for (const part of source.split(',')) {
      const email = part.trim().toLowerCase();
      if (email) emails.add(email);
    }
  }

  return [...emails];
}

/** Super admin emails — SUPER_ADMIN_EMAILS, ADMIN_EMAIL, or legacy SUPER_ADMIN_EMAIL */
export const SUPER_ADMIN_EMAILS = parseSuperAdminEmailsFromSources(
  process.env.SUPER_ADMIN_EMAILS,
  process.env.ADMIN_EMAIL,
  process.env.SUPER_ADMIN_EMAIL
);

export { parseSuperAdminEmailsFromSources };

export const USER_ROLES = ['super_admin', 'admin', 'user', 'enterprise_user'] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** Can access /admin panel */
export function hasAdminPanelAccess(role: string | null | undefined): boolean {
  return role === 'super_admin' || role === 'admin';
}

/** Super admin only */
export function hasSuperAdminRole(role: string | null | undefined): boolean {
  return role === 'super_admin';
}

/** Unlimited AI usage — super admin only */
export function hasUnlimitedAiAccess(role: string | null | undefined): boolean {
  return role === 'super_admin';
}

/** @deprecated Use hasAdminPanelAccess */
export function hasAdminRole(role: string | null | undefined): boolean {
  return hasAdminPanelAccess(role);
}

export const DEFAULT_STARTER_TOKENS = 100_000;
export const DEFAULT_PRO_TOKENS = 1_000_000;

/** Contact for requesting additional token allocation */
export const TOKEN_SUPPORT_EMAIL = 'satya.sootar06@gmail.com';
export const TOKEN_SUPPORT_X_URL = 'https://x.com/satyasootar';

export const DEFAULT_TOKEN_ACTION_COSTS = [
  { actionKey: 'ai_chat', displayName: 'AI Chat Message', tokenCost: 100 },
  { actionKey: 'ai_chat_summary', displayName: 'AI Chat Summary', tokenCost: 50 },
  { actionKey: 'ai_email_reply', displayName: 'AI Email Reply', tokenCost: 150 },
  { actionKey: 'ai_email_draft', displayName: 'AI Email Draft', tokenCost: 120 },
  { actionKey: 'ai_email_summary', displayName: 'AI Email Summary', tokenCost: 40 },
  { actionKey: 'ai_email_triage', displayName: 'AI Email Triage', tokenCost: 25 },
  { actionKey: 'ai_daily_brief', displayName: 'AI Daily Brief', tokenCost: 80 },
  { actionKey: 'ai_agent_action', displayName: 'AI Agent Action', tokenCost: 80 },
  { actionKey: 'ai_automation', displayName: 'AI Automation Task', tokenCost: 200 },
  { actionKey: 'ai_suggestion', displayName: 'AI Suggestion', tokenCost: 20 },
  { actionKey: 'ai_transcribe', displayName: 'Voice Transcription', tokenCost: 30 },
  { actionKey: 'ai_content_generation', displayName: 'AI Content Generation', tokenCost: 100 },
] as const;

export const DEFAULT_TOP_UP_PACKS = [
  { name: '+50,000 Tokens', tokenAmount: 50_000, priceCents: 999, sortOrder: 1 },
  { name: '+100,000 Tokens', tokenAmount: 100_000, priceCents: 1799, sortOrder: 2 },
  { name: '+500,000 Tokens', tokenAmount: 500_000, priceCents: 7999, sortOrder: 3 },
] as const;

/** Maps usage feature keys to token action cost keys */
export const USAGE_FEATURE_TO_ACTION: Record<string, string> = {
  chat: 'ai_chat',
  chat_summary: 'ai_chat_summary',
  email_triage: 'ai_email_triage',
  email_compose_enhance: 'ai_email_draft',
  daily_brief: 'ai_daily_brief',
  transcribe: 'ai_transcribe',
  agent_email_send: 'ai_email_draft',
};
