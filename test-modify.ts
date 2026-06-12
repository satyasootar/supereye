import { config } from 'dotenv';
config({ path: '.env.local' });
import { db } from './lib/db';
import { emails } from './lib/db/schema';
import { eq } from 'drizzle-orm';
import { corsair } from './lib/corsair';

async function main() {
  try {
    const allEmails = await db.select().from(emails).limit(1);
    if (allEmails.length === 0) {
      console.log('No emails found in DB');
      return;
    }
    const email = allEmails[0];
    console.log('Testing mark read for email:', email.googleMessageId);
    
    const t = corsair.withTenant(email.userId);
    
    console.log('Calling modify...');
    const result = await t.gmail.api.messages.modify({
      id: email.googleMessageId,
      removeLabelIds: ['UNREAD']
    });
    
    console.log('Success:', result);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

main();
