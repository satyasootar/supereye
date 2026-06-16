/**
 * Copies Google Calendar OAuth app credentials (client_id / client_secret)
 * into the googledrive Corsair integration so Drive connect works without
 * re-entering secrets from Google Cloud Console.
 *
 * Usage: npx tsx scripts/setup-googledrive-from-calendar.ts
 */
import { config } from 'dotenv';

config({ path: '.env.local' });

import { setupCorsair } from 'corsair/setup';
import { corsair } from '../corsair.ts';

async function main() {
  const clientId = await corsair.keys.googlecalendar.get_client_id();
  const clientSecret = await corsair.keys.googlecalendar.get_client_secret();

  if (!clientId || !clientSecret) {
    console.error(
      'Google Calendar OAuth is not configured. Run first:\n' +
        '  npx corsair setup --googlecalendar client_id=YOUR_ID client_secret=YOUR_SECRET'
    );
    process.exit(1);
  }

  const output = await setupCorsair(corsair, {
    credentials: {
      googledrive: {
        client_id: clientId,
        client_secret: clientSecret,
      },
    },
    caller: 'script',
  });

  console.log(output);
  console.log('\nGoogle Drive OAuth app credentials copied from Google Calendar.');
  console.log('Enable Google Drive API + Drive scope in Google Cloud Console, then connect Drive in the app.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
