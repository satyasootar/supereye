import { setInterval } from 'timers';

console.log('🕒 Starting local cron simulator...');
console.log('Sending requests to http://localhost:3000/api/cron/process every 60 seconds.');

setInterval(async () => {
  try {
    const res = await fetch('http://localhost:3000/api/cron/process');
    const data = await res.json();
    
    if (data.processed && data.processed > 0) {
      console.log(`✅ [${new Date().toLocaleTimeString()}] Successfully processed ${data.processed} scheduled email(s).`);
    } else {
      console.log(`⏳ [${new Date().toLocaleTimeString()}] Checked queue. No emails pending.`);
    }
  } catch (error) {
    console.error(`❌ [${new Date().toLocaleTimeString()}] Error connecting to local dev server:`, error.message);
  }
}, 60000); // 60,000 ms = 1 minute

// Trigger an immediate check on startup
console.log('Running initial check...');
fetch('http://localhost:3000/api/cron/process')
  .then(res => res.json())
  .then(data => {
    if (data.processed && data.processed > 0) {
      console.log(`✅ [Initial] Successfully processed ${data.processed} scheduled email(s).`);
    } else {
      console.log('⏳ [Initial] No emails pending.');
    }
  })
  .catch(err => console.error('❌ [Initial] Failed to connect:', err.message));
