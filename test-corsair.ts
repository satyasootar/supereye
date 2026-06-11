import { config } from 'dotenv';
config({ path: '.env.local' });
import { corsair } from './corsair';

async function main() {
    console.log(`Testing Corsair SDK for Gmail and Google Calendar...`);
    
    // We need to operate within a specific tenant's context
    const tenantId = 'satya';
    
    // Get the tenant-scoped SDK instance
    const t = corsair.withTenant(tenantId) as any;

    try {
        // 3. Fetch data from Gmail
        console.log('\n--- Fetching Gmail Messages ---');
        try {
            // Read from cache or call API directly
            const gmailResult = await t.gmail.db.threads.list({});
            console.log("Successfully fetched Gmail messages:");
            console.log(JSON.stringify(gmailResult, null, 2));
        } catch (e) {
            console.error("Failed to fetch Gmail data:", e);
        }

        // 4. Fetch data from Google Calendar
        console.log('\n--- Fetching Google Calendar Events ---');
        try {
            const calendarResult = await t.googlecalendar.api.events.getMany({
                maxResults: 5,
                timeMin: new Date().toISOString()
            });
            console.log("Successfully fetched Google Calendar events:");
            console.log(JSON.stringify(calendarResult, null, 2));
        } catch (e) {
            console.error("Failed to fetch Calendar data:", e);
        }

    } catch (error) {
        console.error("An error occurred during fetch:", error);
    }
}

main();
