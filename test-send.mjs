import { db } from './lib/db/index.js';
import { emails } from './lib/db/schema/index.js';
import { corsair } from './lib/corsair.js';

async function m() {
  const emailList = await db.select().from(emails).limit(1);
  const t = corsair.withTenant(emailList[0].userId);
  try {
    const raw = Buffer.from('To: Parth Munjal <parth.munjal07@gmail.com>\r\nSubject: Re: Testing Email\r\nContent-Type: text/plain; charset="UTF-8"\r\n\r\nTest replay').toString('base64url');
    await t.gmail.api.messages.send({
      userId: 'me',
      raw,
      threadId: emailList[0].threadId
    });
    console.log('SUCCESS');
  } catch (e) {
    console.log('KEYS:', Object.keys(e));
    console.log('RAW ERROR:', e);
  }
  process.exit(0);
}
m();
