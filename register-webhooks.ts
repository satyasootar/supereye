import { db } from './lib/db/index.ts';
import { emails } from './lib/db/schema/index.ts';
import { corsair } from './lib/corsair.ts';

async function main() {
  const allEmails = await db.select().from(emails).limit(1);
  if (allEmails.length === 0) return console.log('No user found');
  
  const userId = allEmails[0].userId;
  const t = corsair.withTenant(userId) as any;
  const appUrl = 'https://margarita-headboard-stowaway.ngrok-free.dev';

  console.log('Registering Google Calendar webhook...');
  try {
    const channelId = `supereye-cal-${userId}-${Date.now()}`;
    const watchRes = await t.googlecalendar.api.events.watch({
      calendarId: 'primary',
      requestBody: {
        id: channelId,
        type: 'web_hook',
        address: `${appUrl}/api/webhooks/corsair?tenantId=${userId}`
      }
    });
    console.log('Calendar webhook registered:', watchRes.data || watchRes);
  } catch (e: any) {
    console.error('Calendar error:', e.message);
  }

  console.log('Registering Gmail webhook...');
  try {
    const watchRes = await t.gmail.api.users.watch({
      userId: 'me',
      requestBody: {
        topicName: 'projects/supereye-499110/topics/corsair-webhooks',
        labelIds: ['INBOX']
      }
    });
    console.log('Gmail webhook registered:', watchRes.data || watchRes);
  } catch (e: any) {
    console.error('Gmail error:', e.message);
  }
}

main().catch(console.error);
