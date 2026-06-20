import { inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users, type UserRole } from '@/lib/db/schema';
import {
  assertCanModifyTargetUser,
  hasSuperAdminRole,
} from './rbac';
import { adjustTokens, resetPeriodTokens } from './tokens';
import { writeAdminAuditLog } from './audit-log';

export type BulkTokenAction = 'add' | 'remove' | 'bonus' | 'reset';

export type BulkTokenUpdateResult = {
  updated: number;
  skipped: { userId: string; reason: string }[];
  errors: { userId: string; error: string }[];
};

export async function bulkAdjustUserTokens(params: {
  adminUserId: string;
  adminRole: UserRole;
  userIds: string[];
  action: BulkTokenAction;
  amount?: number;
  monthlyAllocation?: number;
  reason: string;
}): Promise<BulkTokenUpdateResult> {
  const uniqueIds = [...new Set(params.userIds)];
  const isSuperAdmin = hasSuperAdminRole(params.adminRole);
  const isRemoval = params.action === 'remove';

  if (params.action === 'reset') {
    if (!isSuperAdmin) {
      throw new Error('Only super admins can reset monthly allocation');
    }
    if (params.monthlyAllocation == null) {
      throw new Error('Monthly allocation is required');
    }
  } else {
    if (!isRemoval && !isSuperAdmin) {
      throw new Error('Only super admins can increase token allocation');
    }
    if (!params.amount || params.amount <= 0) {
      throw new Error('Amount must be a positive number');
    }
  }

  const userRows =
    uniqueIds.length > 0
      ? await db
          .select({ id: users.id, role: users.role })
          .from(users)
          .where(inArray(users.id, uniqueIds))
      : [];

  const roleById = new Map(userRows.map((row) => [row.id, row.role as UserRole]));

  const result: BulkTokenUpdateResult = {
    updated: 0,
    skipped: [],
    errors: [],
  };

  for (const userId of uniqueIds) {
    const targetRole = roleById.get(userId);
    if (!targetRole) {
      result.skipped.push({ userId, reason: 'User not found' });
      continue;
    }

    try {
      assertCanModifyTargetUser({
        actorRole: params.adminRole,
        targetRole,
      });
    } catch (e) {
      result.skipped.push({
        userId,
        reason: e instanceof Error ? e.message : 'Cannot modify user',
      });
      continue;
    }

    try {
      if (params.action === 'reset') {
        await resetPeriodTokens(userId, params.monthlyAllocation!, params.adminUserId);
      } else {
        const ledgerAction =
          params.action === 'remove'
            ? 'admin_removal'
            : params.action === 'bonus'
              ? 'bonus_credits'
              : 'admin_allocation';

        await adjustTokens({
          userId,
          amount: isRemoval ? -params.amount! : params.amount!,
          action: ledgerAction,
          reason: params.reason,
          adminUserId: params.adminUserId,
          metadata: { bulk: true },
        });
      }
      result.updated += 1;
    } catch (e) {
      result.errors.push({
        userId,
        error: e instanceof Error ? e.message : 'Update failed',
      });
    }
  }

  if (result.updated > 0) {
    await writeAdminAuditLog({
      adminUserId: params.adminUserId,
      action: 'bulk_token_update',
      targetType: 'user',
      metadata: {
        action: params.action,
        amount: params.amount ?? null,
        monthlyAllocation: params.monthlyAllocation ?? null,
        reason: params.reason,
        userCount: result.updated,
        skippedCount: result.skipped.length,
        errorCount: result.errors.length,
      },
    });
  }

  return result;
}
