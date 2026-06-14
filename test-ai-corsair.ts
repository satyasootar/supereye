import { config } from 'dotenv';
config({ path: '.env.local' });

import { generateText, tool, stepCountIs } from 'ai';
import { z } from 'zod';
import { getTenant } from './lib/corsair';
import { getAgentModel, getAgentProviderLabel } from './lib/agent/model';
import { buildAgentSystemPrompt } from './lib/agent/system-prompt';

async function main() {
  const userId = process.argv[2] ?? process.env.TEST_USER_ID;
  if (!userId) {
    console.error('Usage: npx tsx test-ai-corsair.ts <userId>');
    process.exit(1);
  }

  console.log(`Testing Corsair MCP agent with user: ${userId}`);
  const tenant = getTenant(userId);

  const fetch_emails = tool({
    description: 'Fetch the latest emails from inbox',
    inputSchema: z.object({
      limit: z.number().optional().default(3),
    }),
    execute: async ({ limit }) => {
      console.log(`[Tool] Fetching latest ${limit} emails...`);
      try {
        const result = await tenant.gmail.api.messages.getMany({
          userId: 'me',
          maxResults: limit,
        });
        const items = result.items || [];
        return items.map((h: any) => {
          const subject = h.payload?.headers?.find((hdr: any) => hdr.name === 'Subject')?.value || '(No Subject)';
          const from = h.payload?.headers?.find((hdr: any) => hdr.name === 'From')?.value || 'Unknown';
          return {
            id: h.id,
            snippet: h.snippet,
            subject,
            from,
          };
        });
      } catch (err: any) {
        return { error: err?.message || String(err) };
      }
    },
  });

  const fetch_events = tool({
    description: 'Fetch upcoming calendar events',
    inputSchema: z.object({
      limit: z.number().optional().default(3),
    }),
    execute: async ({ limit }) => {
      console.log(`[Tool] Fetching next ${limit} calendar events...`);
      try {
        const start = new Date().toISOString();
        const result = await tenant.googlecalendar.api.events.getMany({
          calendarId: 'primary',
          timeMin: start,
          singleEvents: true,
          orderBy: 'startTime',
          maxResults: limit,
        });
        const items = result.items || [];
        return items.map((e: any) => ({
          id: e.id,
          summary: e.summary || '(No Title)',
          start: e.start?.dateTime || e.start?.date,
          end: e.end?.dateTime || e.end?.date,
        }));
      } catch (err: any) {
        return { error: err?.message || String(err) };
      }
    },
  });

  const model = getAgentModel();

  const result = await generateText({
    model,
    tools: { fetch_emails, fetch_events },
    stopWhen: stepCountIs(5),
    system: buildAgentSystemPrompt({
      userName: 'Tester',
      contextLabel: 'Folder: INBOX',
      workspaceMode: 'email',
      folder: 'INBOX',
      providerLabel: getAgentProviderLabel(),
    }),
    prompt:
      'Fetch my latest 3 emails from Gmail and my next 3 upcoming events from Google Calendar. AFTER executing the tools, YOU MUST SUMMARIZE the results to me in a nice list.',
  });

  console.log('\n=== Final Answer ===');
  console.log(result.text || '(empty — check tool results below)');

  if (result.toolResults?.length) {
    console.log('\n=== Tools Executed ===');
    for (const r of result.toolResults) {
      console.log(`- Tool: ${r.toolName}, Output:`, r.output);
    }
  }
}

main().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
