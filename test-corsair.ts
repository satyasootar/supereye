import { corsair } from './lib/corsair';
import { db } from './lib/db';
import { corsairAccounts } from './lib/db/schema';

async function test() {
  const accounts = await db.select().from(corsairAccounts);
  console.log("Found accounts:", accounts);

  if (accounts.length === 0) {
    console.log("No accounts found. User has not authorized.");
    return;
  }

  const tenantId = accounts[0].tenantId;
  console.log("Using tenantId:", tenantId);

  const t = corsair.withTenant(tenantId) as any;

  try {
    console.log("Fetching Gmail db threads...");
    const gmailResult = await t.gmail.db.threads.list({});
    console.log("Gmail success, found:", gmailResult.length, "threads.");
  } catch (e: any) {
    console.error("Gmail db error:", e?.message || e);
  }

  try {
    console.log("Fetching Gmail api messages...");
    const gmailApiResult = await t.gmail.api.messages.list({ maxResults: 10 });
    console.log("Gmail API success, found:", gmailApiResult.messages?.length, "messages.");
  } catch (e: any) {
    console.error("Gmail API error:", e?.message || e);
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  try {
    console.log("Fetching Calendar api events using list...");
    const calendarResult = await t.googlecalendar.api.events.list({
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      maxResults: 50,
      singleEvents: true,
      orderBy: 'startTime',
      calendarId: 'primary'
    });
    console.log("Calendar list success, found:", calendarResult.items?.length, "events.");
  } catch (e: any) {
    console.error("Calendar list error:", e?.message || e);
    try {
      console.log("Trying getMany instead...");
      const calendarResult2 = await t.googlecalendar.api.events.getMany({
        timeMin: startOfDay.toISOString(),
        timeMax: endOfDay.toISOString(),
        maxResults: 50,
        singleEvents: true,
        orderBy: 'startTime'
      });
      console.log("Calendar getMany success:", calendarResult2.items?.length);
    } catch (e2: any) {
      console.error("Calendar getMany error:", e2?.message || e2);
    }
  }

  process.exit(0);
}

test();
