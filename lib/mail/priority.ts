import type { emails } from '@/lib/db/schema';

export type EmailPriorityTier = 'urgent' | 'can_wait';

export const PRIORITY_TIER_LABELS: Record<EmailPriorityTier, string> = {
  urgent: 'Urgent',
  can_wait: 'Can wait',
};

export function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}…`;
}

type EmailRow = typeof emails.$inferSelect;

export function mapEmailRowToMessage(
  email: EmailRow,
  linkId?: string | null
) {
  return {
    id: email.googleMessageId,
    snippet: email.snippet,
    body: email.body,
    subject: email.subject,
    sender: email.fromAddress,
    isRead: email.isRead,
    isStarred: email.isStarred,
    isLinkedToEvent: !!linkId,
    date: email.internalDate,
    toAddresses: email.toAddresses,
    priorityTier: email.priorityTier ?? null,
    priorityScore: email.priorityScore ?? null,
    priorityReason: email.priorityReason ?? null,
    priorityClassifiedAt: email.priorityClassifiedAt ?? null,
  };
}
