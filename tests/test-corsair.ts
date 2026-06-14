import { corsair } from './lib/corsair';
import { db } from './lib/db';
import { corsairAccounts } from './lib/db/schema';

async function test() {
  const accounts = await db.select().from(corsairAccounts);
  if (accounts.length === 0) return;

  const tenantId = accounts[0].tenantId;
  const t = corsair.withTenant(tenantId) as any;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfWindow = new Date();
  endOfWindow.setDate(endOfWindow.getDate() + 7);
  endOfWindow.setHours(23, 59, 59, 999);

  try {
    const calendarResult = await t.googlecalendar.api.events.getMany({
      timeMin: startOfDay.toISOString(),
      timeMax: endOfWindow.toISOString(),
      maxResults: 50,
      singleEvents: true,
      orderBy: 'startTime',
      calendarId: 'primary'
    });
    console.log("calendarResult items?", calendarResult.items);
    console.log("calendarResult items length:", calendarResult.items?.length);
  } catch (e: any) {
    console.error("Calendar Error:", e?.message || e);
  }

  process.exit(0);
}

test();
