import { db } from '@/lib/db';
import { users, accounts } from '@/lib/db/schema/auth';
import { corsairAccounts, corsairIntegrations } from '@/lib/db/schema/corsair';
import { eq } from 'drizzle-orm';

export type IntegrationStatus = {
  plugin: 'gmail' | 'googlecalendar';
  label: string;
  connected: boolean;
  connectedAt: string | null;
};

export type UserProfile = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  createdAt: string;
  authProvider: string;
  integrations: IntegrationStatus[];
};

const INTEGRATION_META: Record<
  'gmail' | 'googlecalendar',
  { label: string; matchers: string[] }
> = {
  gmail: { label: 'Gmail', matchers: ['gmail'] },
  googlecalendar: {
    label: 'Google Calendar',
    matchers: ['googlecalendar', 'google_calendar', 'calendar'],
  },
};

function resolvePlugin(name: string): 'gmail' | 'googlecalendar' | null {
  const normalized = name.toLowerCase();
  if (INTEGRATION_META.gmail.matchers.some((m) => normalized.includes(m))) return 'gmail';
  if (INTEGRATION_META.googlecalendar.matchers.some((m) => normalized.includes(m))) {
    return 'googlecalendar';
  }
  return null;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return null;

  const [authAccount] = await db
    .select({ provider: accounts.provider })
    .from(accounts)
    .where(eq(accounts.userId, userId))
    .limit(1);

  const linked = await db
    .select({
      integrationName: corsairIntegrations.name,
      updatedAt: corsairAccounts.updatedAt,
    })
    .from(corsairAccounts)
    .innerJoin(
      corsairIntegrations,
      eq(corsairAccounts.integrationId, corsairIntegrations.id)
    )
    .where(eq(corsairAccounts.tenantId, userId));

  const integrationMap = new Map<'gmail' | 'googlecalendar', string>();

  for (const row of linked) {
    const plugin = resolvePlugin(row.integrationName);
    if (!plugin) continue;
    integrationMap.set(plugin, row.updatedAt.toISOString());
  }

  const integrations: IntegrationStatus[] = (
    ['gmail', 'googlecalendar'] as const
  ).map((plugin) => ({
    plugin,
    label: INTEGRATION_META[plugin].label,
    connected: integrationMap.has(plugin),
    connectedAt: integrationMap.get(plugin) ?? null,
  }));

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    createdAt: user.createdAt.toISOString(),
    authProvider: authAccount?.provider ?? 'google',
    integrations,
  };
}
