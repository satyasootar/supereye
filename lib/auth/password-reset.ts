import { createHash, randomBytes } from 'crypto';
import { and, eq, gt, isNull, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { passwordResetTokens, sessions, users } from '@/lib/db/schema';
import { getUserByEmail, resetUserPassword } from '@/lib/auth/credentials';
import { normalizeUserEmail } from '@/lib/auth/normalize-email';
import {
  buildPasswordResetEmail,
  sendTransactionalEmail,
} from '@/lib/email/resend';
import { getSiteUrl } from '@/lib/site/config';

const TOKEN_BYTES = 32;
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_HOUR = 3;

export function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function createRawToken(): string {
  return randomBytes(TOKEN_BYTES).toString('base64url');
}

async function countRecentResetRequests(userId: string): Promise<number> {
  const since = new Date(Date.now() - TOKEN_TTL_MS);
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.userId, userId),
        gt(passwordResetTokens.createdAt, since)
      )
    );
  return row?.count ?? 0;
}

async function invalidateActiveTokens(userId: string) {
  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(passwordResetTokens.userId, userId),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, new Date())
      )
    );
}

/**
 * Request a password reset email. Always returns success to avoid email enumeration.
 */
export async function requestPasswordReset(email: string): Promise<{ ok: true }> {
  const user = await getUserByEmail(normalizeUserEmail(email));

  if (!user?.email || user.status === 'suspended') {
    return { ok: true };
  }

  const recentCount = await countRecentResetRequests(user.id);
  if (recentCount >= MAX_REQUESTS_PER_HOUR) {
    return { ok: true };
  }

  await invalidateActiveTokens(user.id);

  const rawToken = createRawToken();
  const tokenHash = hashResetToken(rawToken);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await db.insert(passwordResetTokens).values({
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  const resetUrl = `${getSiteUrl()}/reset-password?token=${encodeURIComponent(rawToken)}`;
  const { subject, html, text } = buildPasswordResetEmail({
    resetUrl,
    userName: user.name,
  });

  const sendResult = await sendTransactionalEmail({
    to: user.email,
    subject,
    html,
    text,
  });

  if ('error' in sendResult) {
    console.error('[password-reset] email failed for user', user.id, sendResult.error);
  }

  return { ok: true };
}

export async function validatePasswordResetToken(
  rawToken: string
): Promise<{ valid: true; userId: string } | { valid: false }> {
  if (!rawToken || rawToken.length < 20) {
    return { valid: false };
  }

  const tokenHash = hashResetToken(rawToken);
  const [row] = await db
    .select({
      id: passwordResetTokens.id,
      userId: passwordResetTokens.userId,
      expiresAt: passwordResetTokens.expiresAt,
      usedAt: passwordResetTokens.usedAt,
    })
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.tokenHash, tokenHash))
    .limit(1);

  if (!row || row.usedAt || row.expiresAt.getTime() <= Date.now()) {
    return { valid: false };
  }

  const [user] = await db
    .select({ status: users.status })
    .from(users)
    .where(eq(users.id, row.userId))
    .limit(1);

  if (!user || user.status === 'suspended') {
    return { valid: false };
  }

  return { valid: true, userId: row.userId };
}

export async function completePasswordReset(
  rawToken: string,
  newPassword: string
): Promise<{ error?: string }> {
  const tokenHash = hashResetToken(rawToken);
  const now = new Date();

  const [row] = await db
    .select({
      id: passwordResetTokens.id,
      userId: passwordResetTokens.userId,
      expiresAt: passwordResetTokens.expiresAt,
      usedAt: passwordResetTokens.usedAt,
    })
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.tokenHash, tokenHash))
    .limit(1);

  if (!row || row.usedAt || row.expiresAt.getTime() <= now.getTime()) {
    return { error: 'This reset link is invalid or has expired' };
  }

  const [user] = await db
    .select({ status: users.status })
    .from(users)
    .where(eq(users.id, row.userId))
    .limit(1);

  if (!user || user.status === 'suspended') {
    return { error: 'This account cannot reset its password' };
  }

  const passwordResult = await resetUserPassword(row.userId, newPassword);
  if (passwordResult.error) {
    return passwordResult;
  }

  await db
    .update(passwordResetTokens)
    .set({ usedAt: now })
    .where(eq(passwordResetTokens.id, row.id));

  await invalidateActiveTokens(row.userId);

  await db.delete(sessions).where(eq(sessions.userId, row.userId));

  return {};
}
