import { encryptDEK, generateDEK } from 'corsair/core';
import { createCorsairDatabase } from 'corsair/db';
import { randomUUID } from 'node:crypto';
import { pool } from '@/lib/db/pool';

function getKek(): string {
  const kek = process.env.CORSAIR_KEK;
  if (!kek) throw new Error('CORSAIR_KEK is not set');
  return kek;
}

/** Ensures a Corsair tenant account row exists for an integration (required before storing OAuth tokens). */
export async function ensureCorsairAccount(
  integrationName: string,
  tenantId: string
): Promise<void> {
  const database = createCorsairDatabase(pool);
  const integration = await database.db
    .selectFrom('corsair_integrations')
    .select('id')
    .where('name', '=', integrationName)
    .executeTakeFirst();

  if (!integration) {
    throw new Error(`Integration '${integrationName}' not found. Run corsair:bootstrap first.`);
  }

  const existing = await database.db
    .selectFrom('corsair_accounts')
    .select('id')
    .where('tenant_id', '=', tenantId)
    .where('integration_id', '=', integration.id)
    .executeTakeFirst();

  if (existing) return;

  const now = new Date();
  await database.db
    .insertInto('corsair_accounts')
    .values({
      id: randomUUID(),
      tenant_id: tenantId,
      integration_id: integration.id,
      config: {},
      dek: await encryptDEK(generateDEK(), getKek()),
      created_at: now,
      updated_at: now,
    })
    .execute();
}
