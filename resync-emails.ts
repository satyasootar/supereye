import { db } from './lib/db/index.ts';
import { emails } from './lib/db/schema/index.ts';
import { syncGmailForUser } from './lib/mail/sync.ts';

async function main() {
  const allEmails = await db.select().from(emails).limit(1);
  if (allEmails.length === 0) return console.log('No user found');
  
  const userId = allEmails[0].userId;
  console.log('Syncing emails for user', userId);
  
  try {
    const res = await syncGmailForUser(userId);
    console.log('Sync result:', res);
  } catch (e: any) {
    console.error('Error:', e.message);
  }
}

main().catch(console.error);
