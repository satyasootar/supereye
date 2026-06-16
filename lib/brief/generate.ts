import { generateObject } from 'ai';
import { z } from 'zod';
import { getTriageModel } from '@/lib/agent/triage-model';
import { logAndConsumeAiUsage } from '@/lib/billing/usage';
import { sseEmitter } from '@/lib/sse/emitter';
import { buildBriefPayload, getCachedBrief, saveBriefCache } from './aggregate';
import { triagePendingEmailsForUser } from '@/lib/mail/triage';
import { getConnectedPluginIds } from '@/lib/plugins/integrations';
import type { BriefPayload } from './types';

const narrativeSchema = z.object({
  narrative: z.string().max(1200),
  highlights: z.array(z.string().max(200)).max(5),
});

function buildPrompt(payload: BriefPayload): string {
  const connected = new Set(payload.connectedPluginIds);
  const sections: string[] = [];

  const statParts: string[] = [];
  if (connected.has('email')) {
    statParts.push(`${payload.stats.unreadInbox} unread`);
    statParts.push(`${payload.triage.urgent} urgent triage`);
    statParts.push(`${payload.stats.otpsToday} OTP emails`);
  }
  if (connected.has('calendar')) {
    statParts.push(`${payload.stats.meetingsToday} meetings today`);
  }
  if (connected.has('github') && payload.github) {
    statParts.push(
      `${payload.github.stats.openPulls} open PRs`,
      `${payload.github.stats.openIssues} open issues across ${payload.github.stats.repoCount} repos`
    );
  }

  if (connected.has('calendar')) {
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
    sections.push(`Today's calendar:\n${eventLines || '(none)'}`);
  }

  if (connected.has('email')) {
    const urgentLines = payload.urgentEmails
      .slice(0, 5)
      .map((e) => `- [${e.category}] ${e.subject} (${e.sender})`)
      .join('\n');
    sections.push(`Urgent emails:\n${urgentLines || '(none)'}`);

    const otpLines = (payload.emailsByCategory.otp ?? [])
      .slice(0, 3)
      .map((e) => `- ${e.subject} from ${e.sender}`)
      .join('\n');
    sections.push(`OTP / verification emails:\n${otpLines || '(none)'}`);

    const bankLines = (payload.emailsByCategory.bank ?? [])
      .slice(0, 3)
      .map((e) => `- ${e.subject}`)
      .join('\n');
    sections.push(`Bank/finance:\n${bankLines || '(none)'}`);
  }

  if (connected.has('github') && payload.github) {
    const githubLines = payload.github.attentionItems
      .slice(0, 6)
      .map((item) => {
        const type = item.kind === 'pull' ? 'PR' : 'Issue';
        const draft = item.draft ? ' (draft)' : '';
        return `- [${type}] ${item.repoFullName}#${item.number}: ${item.title}${draft}${item.authorLogin ? ` by @${item.authorLogin}` : ''}`;
      })
      .join('\n');
    sections.push(`GitHub — needs attention:\n${githubLines || '(none)'}`);
  }

  const connectedLabels = payload.plugins
    .filter((p) => p.connected)
    .map((p) => p.label)
    .join(', ');

  const dataNote =
    connected.size === 0
      ? 'The user has no connected integrations yet — encourage them to connect plugins in settings.'
      : `Connected integrations: ${connectedLabels}. Only reference data from these sources.`;

  return `You are writing a concise daily command-center brief for a busy professional. Be direct, actionable, and warm. 3-5 sentences max in narrative. Highlights are short bullet action items (max 5).

${dataNote}

${statParts.length > 0 ? `Stats: ${statParts.join(', ')}.` : ''}

${sections.join('\n\n')}

Mention join links for imminent meetings when relevant. Mention open PRs or issues when GitHub is connected. Do not invent emails, events, or GitHub items not listed. Do not mention Gmail, Calendar, or GitHub if that integration is not connected.`;
}

export async function generateDailyBrief(
  userId: string,
  options?: { force?: boolean }
): Promise<BriefPayload> {
  const connectedPluginIds = await getConnectedPluginIds(userId);

  if (connectedPluginIds.includes('email')) {
    await triagePendingEmailsForUser(userId, 8);
  }

  if (!options?.force) {
    const cached = await getCachedBrief(userId);
    if (cached?.narrative) {
      const fresh = await buildBriefPayload(userId);
      return { ...fresh, narrative: cached.narrative };
    }
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
        sourcePlugin: null,
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
    const connected = new Set(payload.connectedPluginIds);
    const parts: string[] = [];

    if (payload.actionItems.length > 0) {
      parts.push(
        `You have ${payload.actionItems.length} prioritized actions today — start with "${payload.actionItems[0].title}".`
      );
    } else if (connected.has('email') && connected.has('calendar')) {
      parts.push(
        `Your inbox is clear and you have ${payload.todayEvents.length} event(s) on the calendar today.`
      );
    } else if (connected.has('email')) {
      parts.push('Your inbox is clear for now.');
    } else if (connected.has('calendar')) {
      parts.push(`You have ${payload.todayEvents.length} event(s) on the calendar today.`);
    } else if (connected.has('github') && payload.github) {
      parts.push(
        `GitHub: ${payload.github.stats.openPulls} open PR(s) and ${payload.github.stats.openIssues} open issue(s) across your repos.`
      );
    } else {
      parts.push('Connect your plugins to get a personalized daily brief.');
    }

    narrative = parts.join(' ');
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
