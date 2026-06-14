import { config } from 'dotenv';
config({ path: '.env.local' });

async function main() {
  const { generateText, tool } = await import('ai');
  const { createMistral } = await import('@ai-sdk/mistral');
  const { z } = await import('zod');
  const { corsair } = await import('./lib/corsair');

  const userId = '30081034-0831-4c35-9154-147cebbd473d'; // Ensure this matches your local DB user ID
  console.log(`Testing with user ID: ${userId}`);

  const tenant = corsair.withTenant(userId);

  const mistral = createMistral({
    apiKey: process.env.MISTRAL_API_KEY,
  });

  console.log("Sending request to Mistral API with custom local tools...");

  // Define tools for Vercel AI SDK that wrap the Corsair tenant directly!
  const myTools = {
    fetch_emails: tool({
      description: 'Fetch the latest emails from Gmail',
      parameters: z.object({
        limit: z.number().optional().describe('Maximum number of emails to fetch'),
      }),
      execute: async ({ limit }) => {
        try {
          console.log('Fetching emails...');
          const res = await tenant.gmail.api.messages.list({
            maxResults: limit || 3,
            labelIds: ['INBOX'],
          });
          
          const details = [];
          if (res.messages) {
            for (const msg of res.messages.slice(0, limit || 3)) {
              const detail = await tenant.gmail.api.messages.get({
                id: msg.id!,
                format: 'metadata',
                metadataHeaders: ['Subject', 'From'],
              });
              details.push({
                 id: msg.id,
                 snippet: detail.snippet,
                 subject: detail.payload?.headers?.find(h => h.name === 'Subject')?.value,
                 from: detail.payload?.headers?.find(h => h.name === 'From')?.value
              });
            }
          }
          console.log(`Fetched ${details.length} emails.`);
          return details;
        } catch (e: any) {
          console.error("Error fetching emails:", e.message);
          return { error: e.message };
        }
      },
    }),
    fetch_events: tool({
      description: 'Fetch upcoming events from Google Calendar',
      parameters: z.object({
        limit: z.number().optional().describe('Maximum number of events to fetch'),
      }),
      execute: async ({ limit }) => {
        try {
          console.log('Fetching events...');
          const res = await tenant.googlecalendar.api.events.getMany({
            calendarId: 'primary',
            maxResults: limit || 3,
            timeMin: new Date().toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
          });
          const mapped = res.items?.map(e => ({
            summary: e.summary,
            startTime: e.start?.dateTime || e.start?.date,
            link: e.htmlLink
          })) || [];
          console.log(`Fetched ${mapped.length} events.`);
          return mapped;
        } catch (e: any) {
          console.error("Error fetching events:", e.message);
          return { error: e.message };
        }
      },
    })
  };

  const result = await generateText({
    model: mistral('mistral-large-latest'),
    tools: myTools,
    maxSteps: 5,
    prompt: 'Fetch my latest 3 emails from Gmail and my next 3 upcoming events from Google Calendar. AFTER executing the tools, YOU MUST SUMMARIZE the results to me in a nice markdown list.',
  });

  let finalAnswer = result.text;

  // If Mistral returns empty text after tools (common with some adapters), force a final summary!
  if (!finalAnswer.trim() && result.toolResults && result.toolResults.length > 0) {
     console.log("Mistral generated empty text. Forcing a final summary manually...");
     
     const contextData = result.toolResults.map(r => `${r.toolName} Data:\n${JSON.stringify(r.result, null, 2)}`).join('\n\n');
     
     const finalRes = await generateText({
       model: mistral('mistral-large-latest'),
       prompt: `I asked to fetch my latest 3 emails and next 3 calendar events. Here is the data that was fetched:\n\n${contextData}\n\nPlease summarize this nicely in a markdown list.`
     });
     finalAnswer = finalRes.text;
  }

  console.log("\n=== Final Answer ===");
  console.log(finalAnswer);

  if (result.toolResults && result.toolResults.length > 0) {
    console.log("\n=== Tools Executed ===");
    for (const res of result.toolResults) {
       console.log(`- ${res.toolName} (Returned ${JSON.stringify(res.result).length} bytes of data)`);
    }
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
