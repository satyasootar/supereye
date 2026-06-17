# Scheduled Email Cron

In **production Docker**, scheduled emails are processed automatically by the `cron` service in `docker-compose.prod.yml`. It calls `/api/cron/process` every 60 seconds with the `CRON_SECRET` bearer token.

No host-level crontab is required when using Docker Compose.

## Verify cron is running

```bash
docker compose -f docker-compose.prod.yml logs cron
```

## Manual trigger (debugging)

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://app.yourdomain.com/api/cron/process
```

## Non-Docker VPS (legacy)

If running `next start` directly without Docker:

```bash
crontab -e
```

Add:

```bash
* * * * * curl -sf -H "Authorization: Bearer YOUR_CRON_SECRET" http://127.0.0.1:3000/api/cron/process >/dev/null 2>&1
```

Replace `YOUR_CRON_SECRET` with the value from `.env`.
