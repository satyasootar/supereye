# Corsair Integration Documentation

## Overview
This document outlines the architecture and implementation details for integrating **Corsair SDK** (Self-Hosted) in the Supereye project. We use Corsair to securely connect and fetch data from third-party APIs like Gmail and Google Calendar.

Because we are fully self-hosting Corsair (instead of using the Managed App), all OAuth tokens, integration secrets, and user accounts are stored directly in our own PostgreSQL database alongside our application data (using Drizzle ORM).

---

## 1. Core Architecture

### 1.1 The `corsair.ts` Config
The `corsair.ts` file in the root directory acts as the central initialization hub. It configures the PostgreSQL connection and initializes the Corsair instance with the required plugins (`@corsair-dev/gmail`, `@corsair-dev/googlecalendar`).

**Crucial Note for AI & Devs:** 
The Corsair CLI (`npx corsair setup`, `npx corsair auth`) relies on finding this `corsair.ts` file in the project root to know which database to target and what KEK (Key Encryption Key) to use. Do not move or rename this file without updating CLI commands.

### 1.2 Multi-Tenancy
We configured the SDK with `multiTenancy: true`. In Corsair, a "Tenant" maps 1-to-1 with a User in our application. When a user signs up for Supereye, their unique User ID (e.g., from our Auth provider) becomes their Corsair `tenantId`. This ensures data isolation.

---

## 2. Setting Up Integrations (Application Level)

Before users can log in, the Supereye application itself needs to be authorized with Google.

1. Generate a Client ID and Client Secret from the [Google Cloud Console](https://console.cloud.google.com/).
2. Ensure your OAuth consent screen includes the necessary scopes:
   - `https://mail.google.com/` (Gmail)
   - `https://www.googleapis.com/auth/calendar` (Calendar)
   - `https://www.googleapis.com/auth/drive.readonly` (Drive — or `drive` for full access)
3. Inject the application credentials into the local database using the CLI:

```bash
npx corsair setup --googlecalendar client_id=YOUR_ID client_secret=YOUR_SECRET
npx corsair setup --gmail client_id=YOUR_ID client_secret=YOUR_SECRET topic_id=dummy-topic
npx corsair setup --googledrive client_id=YOUR_ID client_secret=YOUR_SECRET
```
*(Use the same `client_id` / `client_secret` from your Google Cloud OAuth app for all three. Enable **Google Drive API** in APIs & Services → Library, and add the Drive scope to your OAuth consent screen.)*

---

## 3. User Authentication (Production Workflow)

To fetch data for actual users in the Next.js app, we must handle the Google OAuth flow so users can grant Supereye permission to read their data.

### 3.1 The Next.js API Route (Callback Handler)
Instead of using the CLI like we did in testing, production requires an HTTP callback route. Corsair provides a built-in Next.js handler to process the Google OAuth redirects.

Create `app/api/corsair/[...corsair]/route.ts`:
```typescript
import { corsair } from '@/corsair'; // Import the shared instance
import { toNextJsHandler } from 'corsair';

const handler = toNextJsHandler(corsair);

export { handler as GET, handler as POST };
```

### 3.2 Generating the Auth URL
When a user clicks "Connect Gmail" in your frontend dashboard, you need to generate an auth URL and redirect them:

```typescript
import { corsair } from '@/corsair';

// Inside a Server Action or API Route:
export async function connectIntegration(userId: string, pluginName: 'gmail' | 'googlecalendar') {
  // Generate the Google Login URL specifically for this user
  const authUrl = await corsair[pluginName].oauth.getAuthUrl({
    tenantId: userId, // Lock the tokens to this specific user ID
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/corsair/callback`
  });
  
  return authUrl; // The frontend should window.location.href = authUrl
}
```

**What happens next?**
1. The user signs in with Google.
2. Google redirects them back to `/api/corsair/callback`.
3. Corsair's Next.js handler automatically intercepts this, securely extracts the `access_token` and `refresh_token`, and saves it to the `corsair_accounts` table for that specific `userId`.

---

## 4. Fetching User Data (Live vs Cached)

Once the user has authenticated (meaning their tokens exist in the DB), we can fetch their data securely anywhere in the backend. 

Corsair provides two distinct ways to access a user's data: **Live API Fetching (`.api`)** and **Cached Database Fetching (`.db`)**.

### 4.1 Live API Fetching (`.api`)
This hits the external Google APIs directly. It is always up-to-date but is slower and subject to rate limits.

```typescript
import { corsair } from '@/corsair';

export async function getLiveEmails(userId: string) {
  const t = corsair.withTenant(userId) as any;
  // Hits Google's servers directly
  const gmailResult = await t.gmail.api.messages.list({ maxResults: 10 });
  return gmailResult.messages;
}
```

### 4.2 Cached Database Fetching (`.db`) -> **(Recommended)**
Everything fetched by Corsair is automatically cached in our local PostgreSQL database. By replacing `.api` with `.db`, we query our own database instead of Google's APIs. This is **significantly faster**, offline-capable, and avoids rate limits.

```typescript
import { corsair } from '@/corsair';

export async function getCachedEmails(userId: string) {
  const t = corsair.withTenant(userId) as any;
  // Reads directly from our local PostgreSQL database (corsair_threads table)
  const gmailResult = await t.gmail.db.threads.list({});
  return gmailResult;
}
```

> [!NOTE]
> **Future Implementation:** For this project, we are going to implement the **Cached Database (`.db`)** approach in our actual features later to ensure the UI feels lightning fast for our users.

### 4.3 Handling Plugin Sync Errors
*Known Issue:* The `@corsair-dev/googlecalendar` plugin automatically attempts to sync events to the local database. Currently, it throws a `ZodError` if it encounters a Google Calendar `eventType` it doesn't recognize (like `"birthday"`). 
*Workaround:* The underlying fetch still succeeds and returns the actual JSON payload. You can safely catch/ignore this database sync error for now while still utilizing the returned API data.

---

## 5. Developer & AI Reference Guide

- **Database Dependency**: The SDK reads directly from PostgreSQL. Always ensure environment variables (`DATABASE_URL`, `.env.local`) are fully loaded before importing/calling `corsair`.
- **Encryption**: `CORSAIR_KEK` is highly critical. It encrypts the OAuth access and refresh tokens in the database. If this key is lost or changed, all existing user connections will permanently break.
- **Testing Locally**: Use the CLI `npx corsair auth --plugin=gmail --tenant=test_user_123` to spoof an OAuth flow and inject tokens during development without having to build the full Next.js UI buttons.
- **SDK Typing**: The dynamic plugins (e.g., `t.gmail.api`) might require casting `as any` in TypeScript, as the plugin APIs are dynamically attached at runtime.

---

## 6. Setting up Webhooks (Real-time Push Notifications)

Corsair can automatically listen for real-time updates from Google (like when a new email arrives or a calendar event is modified) and process them to update the local database. 

Google requires a publicly accessible HTTPS endpoint to send these webhooks. In production, this is your `https://your-domain.com/api/corsair/webhook` endpoint. However, for local development, you must expose your local server using a tool like `localtunnel` or `ngrok`.

### 6.1 Exposing Your Local Server
1. Start your local server (or our `test-webhook.ts` script) on a specific port (e.g., 3001).
2. Open a new terminal and run:
   ```bash
   npx localtunnel --port 3001
   ```
3. Copy the generated public URL (e.g., `https://mighty-pets-chew.loca.lt`).

### 6.2 Gmail Webhooks (Pub/Sub)
Gmail uses Google Cloud Pub/Sub to deliver push notifications.

1. **Register the Watch:** Use the Corsair CLI to tell Google to start watching a specific user's inbox:
   ```bash
   npx corsair auth --plugin=gmail --webhook
   ```
   * The CLI will ask for the `Tenant ID` (e.g., `satya`).
   * It will ask for your Pub/Sub topic name (e.g., `projects/your-project-id/topics/corsair-webhooks`).

2. **Route Pub/Sub to your Local Server:**
   Google is now sending notifications to the Pub/Sub topic, but you need to push them to your localtunnel URL.
   * Go to **Google Cloud Console -> Pub/Sub -> Subscriptions**.
   * Create or edit the subscription attached to your topic.
   * Set the **Delivery Type** to **Push**.
   * Set the **Endpoint URL** to your localtunnel URL + `/webhook` (e.g., `https://mighty-pets-chew.loca.lt/webhook`).

### 6.3 Google Calendar Webhooks (Direct HTTPS)
Google Calendar uses direct HTTPS webhooks (it does not use Pub/Sub).

1. **Register the Watch:**
   ```bash
   npx corsair auth --plugin=googlecalendar --webhook
   ```
   * The CLI will ask for the `Tenant ID`.
   * It will then prompt you directly for the **Webhook URL**. Paste your localtunnel URL (e.g., `https://mighty-pets-chew.loca.lt/webhook`).
2. Google Calendar will now send POST requests directly to your local server whenever an event changes!
