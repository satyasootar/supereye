# VPS Scheduled Email Setup

Because you are hosting this on a VPS instead of a serverless platform like Vercel, you need a way to constantly check if there are scheduled emails ready to be sent.

You can easily automate this using Linux's built-in `cron` daemon!

### Setup Instructions

1. SSH into your VPS.
2. Open your crontab file by running:
   ```bash
   crontab -e
   ```
3. Add the following line to the very bottom of the file:
   ```bash
   * * * * * curl -s http://localhost:3000/api/cron/process >/dev/null 2>&1
   ```
   *(Note: Change `3000` to whatever port your Next.js application is actually running on in production, e.g., `80` or `8080` if you're using a proxy like Nginx).*

### How it works
- The `* * * * *` means the cron job will run **every 1 minute**.
- It pings the `/api/cron/process` endpoint.
- If there are emails scheduled to go out *before* the current time, the script sends them instantly via Corsair + Gmail.
- It silently ignores errors (`>/dev/null`) so it doesn't clutter your server logs.
