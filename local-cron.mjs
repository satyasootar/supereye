import { config } from 'dotenv';
import { setInterval } from 'timers';

config({ path: '.env' });
config({ path: '.env.local' });

const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(
  /\/$/,
  ''
);
const cronUrl = `${baseUrl}/api/cron/process`;
const cronSecret = process.env.CRON_SECRET;

const headers = cronSecret ? { Authorization: `Bearer ${cronSecret}` } : {};

console.log('Starting local cron simulator...');
console.log(`Target: ${cronUrl} (every 60s)`);

async function tick(label) {
  try {
    const res = await fetch(cronUrl, { headers });
    const data = await res.json();

    if (data.processed && data.processed > 0) {
      console.log(`[${label}] Processed ${data.processed} scheduled email(s).`);
    } else {
      console.log(`[${label}] No emails pending.`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${label}] Error:`, message);
  }
}

setInterval(() => tick(new Date().toLocaleTimeString()), 60_000);
tick('initial');
