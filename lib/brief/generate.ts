import { generateObject } from 'ai';
import { z } from 'zod';
import { getTriageModel } from '@/lib/agent/triage-model';
import { logAndConsumeAiUsage } from '@/lib/billing/usage';
import { sseEmitter } from '@/lib/sse/emitter';
import { buildBriefPayload, getCachedBrief, saveBriefCache } from './aggregate';
import { triagePendingEmailsForUser } from '@/lib/mail/triage';
import type { BriefPayload } from './types';

const narrativeSchema = z.object({
  narrative: z.string().max(1200),
  highlights: z.array(z.string().max(200)).max(5),
});

function buildPrompt(payload: BriefPayload): string {
  const urgentLines = payload.urgentEmails
    .slice(0, 5)
    .map((e) => `- [${e.category}] ${e.subject} (${e.sender})`)
    .join('\n');

  const eventLines = payload.todayEvents
    .slice(0, 6)
    .map((e) => {
      const time = new Date(e.startTime).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
      });
      return `- ${time}: ${e.title}${e.meetUrl ? ' (has join link)' : ''}`;
    })
    .join('\n');

  const otpLines = (payload.emailsByCategory.otp ?? [])
    .slice(0, 3)
    .map((e) => `- ${e.subject} from ${e.sender}`)
    .join('\n');

  const bankLines = (payload.emailsByCategory.bank ?? [])
    .slice(0, 3)
    .map((e) => `- ${e.subject}`)
    .join('\n');

  return `You are writing a concise daily command-center brief for a busy professional. Be direct, actionable, and warm. 3-5 sentences max in narrative. Highlights are short bullet action items (max 5).

Stats: ${payload.stats.unreadInbox} unread, ${payload.stats.meetingsToday} meetings today, ${payload.stats.otpsToday} OTP emails, ${payload.triage.urgent} urgent triage.

Today's calendar:
${eventLines || '(none)'}

Urgent emails:
${urgentLines || '(none)'}

OTP / verification emails:
${otpLines || '(none)'}

Bank/finance:
${bankLines || '(none)'}

Mention join links for imminent meetings when relevant. Do not invent emails or events not listed.`;
}

export async function generateDailyBrief(
  userId: string,
  options?: { force?: boolean }
): Promise<BriefPayload> {
  await triagePendingEmailsForUser(userId, 8);

  if (!options?.force) {
    const cached = await getCachedBrief(userId);
    if (cached?.narrative) return cached;
  }

  const payload = await buildBriefPayload(userId);

  let narrative: string | null = null;

  try {
    const { object, usage } = await generateObject({
      model: getTriageModel(),
      schema: narrativeSchema,
      prompt: buildPrompt(payload),
    });

    narrative = object.narrative;
    if (object.highlights.length > 0) {
      const extra = object.highlights.map((h) => ({
        id: `ai-${h.slice(0, 20)}`,
        kind: 'read_email' as const,
        title: h,
        priority: 50,
      }));
      payload.actionItems = [...payload.actionItems, ...extra]
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 14);
    }

    void logAndConsumeAiUsage(userId, {
      feature: 'daily_brief',
      usage: usage as { inputTokens?: number; outputTokens?: number; totalTokens?: number },
      metadata: { briefDate: payload.briefDate },
    });
  } catch (error) {
    console.error('[daily-brief] AI narrative failed:', error);
    narrative =
      payload.actionItems.length > 0
        ? `You have ${payload.actionItems.length} prioritized actions today — start with "${payload.actionItems[0].title}".`
        : `Your inbox is clear and you have ${payload.todayEvents.length} event(s) on the calendar today.`;
  }

  const finalPayload: BriefPayload = { ...payload, narrative };
  await saveBriefCache(userId, finalPayload, narrative);
  sseEmitter.emit(userId, { type: 'brief:updated' });

  return finalPayload;
}

export async function getTodayBrief(userId: string): Promise<BriefPayload> {
  const cached = await getCachedBrief(userId);
  if (cached) {
    const fresh = await buildBriefPayload(userId, { skipInsightScan: false });
    return { ...fresh, narrative: cached.narrative };
  }
  return buildBriefPayload(userId);
}
