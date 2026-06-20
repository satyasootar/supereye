/**
 * Seed Corsair integration-level OAuth credentials from environment variables.
 * Idempotent — safe to run on every deploy.
 */
import { config } from 'dotenv';

config({ path: '.env' });
config({ path: '.env.local' });

import { createCorsair } from 'corsair';
import { setupCorsair } from 'corsair/setup';
import { gmail } from '@corsair-dev/gmail';
import { googlecalendar } from '@corsair-dev/googlecalendar';
import { github } from '@corsair-dev/github';
import { googledrive } from '@corsair-dev/googledrive';
import pg from 'pg';

const clientId = process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_CLIENT_ID;
const clientSecret =
  process.env.AUTH_GOOGLE_SECRET ?? process.env.GOOGLE_CLIENT_SECRET;
const kek = process.env.CORSAIR_KEK;
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('[corsair-bootstrap] DATABASE_URL is not set');
  process.exit(1);
}

if (!kek) {
  console.error('[corsair-bootstrap] CORSAIR_KEK is not set');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: databaseUrl });

const corsair = createCorsair({
  plugins: [
    gmail(),
    googlecalendar(),
    github({ authType: 'oauth_2' }),
    googledrive(),
  ],
  database: pool,
  kek,
  multiTenancy: true,
});

const credentials = {};

if (clientId && clientSecret) {
  const googleCreds = {
    client_id: clientId,
    client_secret: clientSecret,
  };

  credentials.gmail = { ...googleCreds };
  credentials.googlecalendar = { ...googleCreds };
  credentials.googledrive = { ...googleCreds };

  const pubsubTopic = process.env.GMAIL_PUBSUB_TOPIC;
  if (pubsubTopic) {
    credentials.gmail.topic_id = pubsubTopic;
  }
} else {
  console.warn(
    '[corsair-bootstrap] AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET not set — skipping Google OAuth app setup'
  );
}

const githubClientId = process.env.GITHUB_CLIENT_ID;
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;
if (githubClientId && githubClientSecret) {
  credentials.github = {
    client_id: githubClientId,
    client_secret: githubClientSecret,
  };
} else {
  console.warn(
    '[corsair-bootstrap] GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET not set — skipping GitHub OAuth app setup'
  );
}

try {
  const output = await setupCorsair(corsair, {
    credentials,
    caller: 'script',
  });
  if (output.trim()) console.log(output);
  console.log('[corsair-bootstrap] Integration setup complete');
} catch (error) {
  console.error('[corsair-bootstrap] Failed:', error);
  process.exit(1);
} finally {
  await pool.end();
}
