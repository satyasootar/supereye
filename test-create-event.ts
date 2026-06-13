import { db } from './lib/db';
import { users } from './lib/db/schema';
import { getTenant } from './lib/corsair';

async function run() {
  const allUsers = await db.select().from(users);
  if (allUsers.length === 0) {
    console.log("No users found.");
    process.exit(1);
  }
  
  const userId = allUsers[0].id;
  const t = getTenant(userId);
  
  try {
    const event = {
      summary: 'Webhook Test Event (5 PM)',
      description: 'This event was created automatically to test if webhooks trigger a sync in the UI.',
      start: {
        dateTime: '2026-06-13T11:30:00Z'
      },
      end: {
        dateTime: '2026-06-13T12:30:00Z'
      }
    };

    console.log("Sending event payload to Google...");
    const result = await t.googlecalendar.api.events.create({
      calendarId: 'primary',
      event: event
    });
    
    console.log("SUCCESS! Created event:", result.summary);
    console.log("Look at your ngrok terminal now!");
    
  } catch (error: any) {
    console.error("Failed:", error.message);
  }
  
  process.exit(0);
}

run();
