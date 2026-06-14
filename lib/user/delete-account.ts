import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/auth';
import {
  corsairAccounts,
  corsairEntities,
  corsairEvents,
} from '@/lib/db/schema/corsair';
import { eq, inArray } from 'drizzle-orm';

export class DeleteAccountError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DeleteAccountError';
  }
}

/**
 * Permanently delete a user and all associated data.
 * Corsair tables are cleaned explicitly (no cascade to users).
 * App + auth tables cascade from users.id.
 */
export async function deleteUserAccount(
  userId: string,
  userEmail: string | null | undefined,
  confirmEmail: string
) {
  const normalizedConfirm = confirmEmail.trim().toLowerCase();
  const normalizedEmail = userEmail?.trim().toLowerCase();

  if (!normalizedEmail || normalizedConfirm !== normalizedEmail) {
    throw new DeleteAccountError('Email confirmation does not match your account');
  }

  await db.transaction(async (tx) => {
    const accounts = await tx
      .select({ id: corsairAccounts.id })
      .from(corsairAccounts)
      .where(eq(corsairAccounts.tenantId, userId));

    const accountIds = accounts.map((row) => row.id);

    if (accountIds.length > 0) {
      await tx
        .delete(corsairEntities)
        .where(inArray(corsairEntities.accountId, accountIds));
      await tx
        .delete(corsairEvents)
        .where(inArray(corsairEvents.accountId, accountIds));
      await tx
        .delete(corsairAccounts)
        .where(eq(corsairAccounts.tenantId, userId));
    }

    const deleted = await tx
      .delete(users)
      .where(eq(users.id, userId))
      .returning({ id: users.id });

    if (deleted.length === 0) {
      throw new DeleteAccountError('User not found');
    }
  });
}
