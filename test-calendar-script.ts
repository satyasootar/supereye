import { config } from 'dotenv';
config({ path: '.env.local' });

async function run() {
  const { db } = await import('./lib/db');
  const { users } = await import('./lib/db/schema');
  const { getTenant } = await import('./lib/corsair');

  const allUsers = await db.select().from(users);
  if (allUsers.length === 0) {
    console.log("No users found.");
    process.exit(0);
  }
  
  const userId = allUsers[0].id;
  console.log("Testing with user:", allUsers[0].email, "ID:", userId);

  const t = getTenant(userId);
  
  try {
    // 1. Fetch data
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfWindow = new Date();
    endOfWindow.setDate(endOfWindow.getDate() + 7);
    
    console.log("1. Fetching events via getMany...");
    const result = await t.googlecalendar.api.events.getMany({
      calendarId: 'primary',
      timeMin: startOfDay.toISOString(),
      timeMax: endOfWindow.toISOString(),
      maxResults: 5,
      singleEvents: true
    });
    console.log("   Success! Fetched", result.items?.length || 0, "events.");
    
    // 2. Test webhook setup
    console.log("2. Testing Webhook Watch Registration...");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    console.log("   Using App URL:", appUrl);
    
    const channelId = `test-watch-${userId}-${Date.now()}`;
    const watchResult = await t.googlecalendar.api.events.watch({
      calendarId: 'primary',
      requestBody: {
        id: channelId,
        type: 'web_hook',
        address: `${appUrl}/api/webhooks/corsair?tenantId=${userId}`,
      }
    });
    console.log("   Watch registered successfully! Channel ID:", watchResult.id);
    
  } catch (error: any) {
    console.error("   Failed:", error);
  }
  
  process.exit(0);
}

run();
