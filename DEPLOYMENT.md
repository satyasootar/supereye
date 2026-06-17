# Supereye Production Deployment Guide

Complete runbook for deploying Supereye to a VPS with Docker, GitHub Actions CI/CD, Google webhooks, and Resend email.

---

## Architecture

```
Internet → Caddy (HTTPS :443) → Next.js app (:3000) → PostgreSQL
                                      ↑
                               cron container (every 60s)
```

Push to `main` → GitHub Actions tests, builds Docker image, pushes to GHCR, SSH deploys to VPS.

---

## Part 1: VPS first-time setup

### 1.1 SSH into your VPS

```bash
ssh root@YOUR_VPS_IP
```

### 1.2 Install Docker and clone the repo

```bash
export REPO_URL=https://github.com/YOUR_GITHUB_USERNAME/supereye.git
curl -fsSL https://raw.githubusercontent.com/YOUR_GITHUB_USERNAME/supereye/main/deploy/vps-install.sh | bash
```

Or manually:

```bash
curl -fsSL https://get.docker.com | sh
git clone https://github.com/YOUR_GITHUB_USERNAME/supereye.git /opt/supereye
cd /opt/supereye
cp .env.example .env
nano .env   # fill in all values (see Part 3)
```

### 1.3 DNS

Create an **A record** pointing your domain to the VPS IP:

| Type | Name | Value |
|------|------|-------|
| A | `app` (or `@`) | `YOUR_VPS_IP` |

Set in `.env`:

```env
DOMAIN=app.yourdomain.com
NEXT_PUBLIC_APP_URL=https://app.yourdomain.com
```

Wait for DNS propagation (usually 5–30 minutes) before starting Caddy.

---

## Part 2: GitHub Actions secrets

In your GitHub repo → **Settings → Secrets and variables → Actions**, add:

| Secret | Description |
|--------|-------------|
| `VPS_HOST` | VPS IP or hostname |
| `VPS_USER` | SSH user (e.g. `root` or `deploy`) |
| `VPS_SSH_KEY` | Private SSH key (full PEM contents) |
| `GHCR_PULL_TOKEN` | GitHub PAT with `read:packages` (for VPS to pull image) |
| `NEXT_PUBLIC_APP_URL` | `https://app.yourdomain.com` (baked into Docker build) |

**Create GHCR_PULL_TOKEN:** GitHub → Settings → Developer settings → Personal access tokens → `read:packages`.

**Create VPS SSH key:**

```bash
ssh-keygen -t ed25519 -C "github-deploy" -f ~/.ssh/supereye_deploy
# Add ~/.ssh/supereye_deploy.pub to VPS ~/.ssh/authorized_keys
# Paste ~/.ssh/supereye_deploy contents into VPS_SSH_KEY secret
```

### Trigger deploy

Every push to `main` runs tests, builds the image, and deploys. First deploy:

```bash
# On VPS after .env is configured:
cd /opt/supereye
docker compose -f docker-compose.prod.yml up -d
```

Subsequent deploys are automatic on `git push`.

---

## Part 3: Environment variables (`.env` on VPS)

Copy `.env.example` → `.env` and fill every value. Generate secrets:

```bash
# AUTH_SECRET
npx auth secret

# CORSAIR_KEK, WEBHOOK_SECRET, CRON_SECRET
openssl rand -base64 32

# POSTGRES_PASSWORD
openssl rand -hex 24
```

Update `DATABASE_URL` and `POSTGRES_PASSWORD` to match. Set `DOCKER_IMAGE` to `ghcr.io/YOUR_USERNAME/supereye:latest`.

---

## Part 4: Google Cloud Console

### 4.1 Create / select project

[Google Cloud Console](https://console.cloud.google.com/) → create project (e.g. `supereye-prod`).

### 4.2 Enable APIs

**APIs & Services → Library** — enable:

- Gmail API
- Google Calendar API
- Google Drive API
- Cloud Pub/Sub API

### 4.3 OAuth consent screen

**APIs & Services → OAuth consent screen**

- User type: **External** (or Internal for Workspace)
- Scopes to add:
  - `openid`, `email`, `profile`
  - `https://mail.google.com/`
  - `https://www.googleapis.com/auth/calendar`
  - `https://www.googleapis.com/auth/drive.readonly` (or `drive`)

### 4.4 OAuth credentials

**APIs & Services → Credentials → Create OAuth client ID → Web application**

**Authorized redirect URIs** (add all):

```
https://app.yourdomain.com/api/auth/callback/google
https://app.yourdomain.com/api/corsair/callback
```

Copy **Client ID** and **Client Secret** into `.env`:

```env
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
```

The app bootstrap script (`corsair-bootstrap.mjs`) copies these into Corsair for Gmail/Calendar/Drive integrations automatically on each deploy.

### 4.5 Gmail Pub/Sub (push webhooks)

#### Step A: Create topic

**Pub/Sub → Topics → Create topic**

- Topic ID: `supereye-gmail`

Note the full path: `projects/YOUR_PROJECT_ID/topics/supereye-gmail`

#### Step B: Grant Gmail permission to publish

**Pub/Sub → Topics → supereye-gmail → Permissions → Grant access**

| Principal | Role |
|-----------|------|
| `gmail-api-push@system.gserviceaccount.com` | Pub/Sub Publisher |

#### Step C: Create push subscription

**Pub/Sub → Subscriptions → Create subscription**

| Field | Value |
|-------|-------|
| Subscription ID | `supereye-gmail-push` |
| Delivery type | **Push** |
| Endpoint URL | `https://app.yourdomain.com/api/webhooks/corsair` |
| Acknowledgement deadline | 10 seconds |

Add to `.env`:

```env
GMAIL_PUBSUB_TOPIC=projects/YOUR_PROJECT_ID/topics/supereye-gmail
GMAIL_PUBSUB_SUBSCRIPTION=projects/YOUR_PROJECT_ID/subscriptions/supereye-gmail-push
```

#### Step D: Verify

After a user connects Gmail in the app, the app registers a Gmail watch automatically. You can also call:

```bash
curl -X POST https://app.yourdomain.com/api/webhooks/register \
  -H "Cookie: <session-cookie>"
```

### 4.6 Google Calendar webhooks

Calendar uses **direct HTTPS push** (no Pub/Sub). The app registers watches automatically when users connect Calendar.

- Webhook URL: `https://app.yourdomain.com/api/webhooks/corsair`
- Verification uses `WEBHOOK_SECRET` (HMAC token per user)

No extra Google Console setup beyond enabling Calendar API and OAuth scopes.

---

## Part 5: Resend (password reset emails)

### 5.1 Create account

[resend.com](https://resend.com) → sign up → **API Keys** → create key.

```env
RESEND_API_KEY=re_...
```

### 5.2 Verify your domain

**Resend → Domains → Add domain** → add DNS records Resend provides (SPF, DKIM).

After verification:

```env
RESEND_FROM_EMAIL=Supereye <noreply@yourdomain.com>
```

### 5.3 Test

Use **Forgot password** on the login page. Email should arrive from your verified domain.

---

## Part 6: Start production stack

```bash
cd /opt/supereye
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml logs -f app
```

On startup the app automatically:

1. Waits for PostgreSQL
2. Runs Drizzle migrations
3. Bootstraps Corsair Google OAuth credentials
4. Starts Next.js

### Services

| Service | Purpose |
|---------|---------|
| `postgres` | Database (persistent volume) |
| `app` | Next.js application |
| `caddy` | HTTPS reverse proxy (Let's Encrypt) |
| `cron` | Scheduled email processor (every 60s) |

---

## Part 7: Post-deploy checklist

- [ ] `https://app.yourdomain.com` loads
- [ ] `https://app.yourdomain.com/api/health` returns `{"status":"ok"}`
- [ ] Google login works
- [ ] Connect Gmail → OAuth completes → emails sync
- [ ] Connect Calendar → events sync
- [ ] Pub/Sub subscription delivers to `/api/webhooks/corsair`
- [ ] Password reset email sends via Resend
- [ ] `docker compose logs cron` shows no auth errors

---

## Part 8: Operations

### View logs

```bash
docker compose -f docker-compose.prod.yml logs -f app
docker compose -f docker-compose.prod.yml logs -f caddy
```

### Manual migration

```bash
docker compose -f docker-compose.prod.yml exec app \
  sh -c 'NODE_PATH=/app/bootstrap_modules node scripts/migrate.mjs'
```

### Restart

```bash
docker compose -f docker-compose.prod.yml restart app
```

### Backup database

```bash
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U supereye supereye > backup-$(date +%F).sql
```

---

## Troubleshooting

### Caddy / SSL fails

- Confirm DNS A record points to VPS
- Ports 80 and 443 open: `ufw allow 80,443/tcp`
- `DOMAIN` in `.env` matches DNS exactly (no `https://`)

### Gmail webhooks not firing

- Verify Pub/Sub subscription endpoint URL is correct HTTPS URL
- Confirm `gmail-api-push@system.gserviceaccount.com` has Publisher on topic
- Check `GMAIL_PUBSUB_SUBSCRIPTION` matches subscription full path
- User must have connected Gmail (watch registers on connect/sync)

### OAuth redirect mismatch

Redirect URIs in Google Console must exactly match:

```
https://YOUR_DOMAIN/api/auth/callback/google
https://YOUR_DOMAIN/api/corsair/callback
```

### CORSAIR_KEK changed

All user integration tokens become unreadable. Users must reconnect integrations. **Never rotate CORSAIR_KEK** without a migration plan.

### GitHub deploy fails on SSH

- Verify `VPS_SSH_KEY`, `VPS_HOST`, `VPS_USER` secrets
- Ensure `/opt/supereye` exists and is a git clone
- Test: `ssh -i key user@host "cd /opt/supereye && git pull"`

---

## Local development (unchanged)

```bash
docker compose -f docker-compose.dev.yml up -d   # Postgres only
cp .env.example .env.local                       # adjust for localhost
npm run dev
```
