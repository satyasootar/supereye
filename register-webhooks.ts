/**
 * Dev utility: register Gmail + Calendar webhooks for the first user in the DB.
 * Production uses registerGmailWatch / registerCalendarWatch automatically on OAuth connect.
 *
 * Usage: npx tsx register-webhooks.ts
 */
import { config } from 'dotenv';

config({ path: '.env' });
config({ path: '.env.local' });

import { db } from './lib/db/index.ts';
import { emails } from './lib/db/schema/index.ts';
import { registerGmailWatch } from './lib/mail/watch.ts';
import { registerCalendarWatch } from './lib/calendar/sync.ts';

async function main() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    console.error('Set NEXT_PUBLIC_APP_URL in .env');
    process.exit(1);
  }

  const allEmails = await db.select().from(emails).limit(1);
  if (allEmails.length === 0) {
    console.log('No users with synced email found');
    return;
  }

  const userId = allEmails[0].userId;
  console.log(`Registering webhooks for user ${userId} → ${appUrl}/api/webhooks/corsair`);

  const gmailWatch = await registerGmailWatch(userId);
  console.log('Gmail watch:', gmailWatch ?? 'skipped or failed');

  const calendarWatch = await registerCalendarWatch(userId);
  console.log('Calendar watch:', calendarWatch ?? 'skipped or failed');
}

main().catch(console.error);
