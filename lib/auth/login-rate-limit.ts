import { createHash, createHmac } from 'crypto';
import { and, eq, gt, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { loginAttempts } from '@/lib/db/schema';

export const LOGIN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
export const LOGIN_RATE_LIMIT_MAX_PER_IP = 20;
export const LOGIN_RATE_LIMIT_MAX_PER_EMAIL = 5;

export type LoginRateLimitReason = 'ip' | 'email';

function rateLimitSecret(): string {
  return process.env.AUTH_SECRET ?? 'dev-login-rate-limit-secret';
}

export function hashLoginRateLimitValue(kind: 'ip' | 'email', value: string): string {
  const normalized =
    kind === 'email' ? value.trim().toLowerCase() : value.trim().toLowerCase();
  return createHmac('sha256', rateLimitSecret())
    .update(`${kind}:${normalized}`)
    .digest('hex');
}

export function isLoginRateLimitExceeded(
  counts: { ip: number; email: number }
): LoginRateLimitReason | null {
  if (counts.email >= LOGIN_RATE_LIMIT_MAX_PER_EMAIL) return 'email';
  if (counts.ip >= LOGIN_RATE_LIMIT_MAX_PER_IP) return 'ip';
  return null;
}

async function countRecentAttempts(column: 'ipHash' | 'emailHash', hash: string) {
  const since = new Date(Date.now() - LOGIN_RATE_LIMIT_WINDOW_MS);
  const field = column === 'ipHash' ? loginAttempts.ipHash : loginAttempts.emailHash;

  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(loginAttempts)
    .where(and(eq(field, hash), gt(loginAttempts.createdAt, since)));

  return row?.count ?? 0;
}

async function pruneOldAttempts() {
  const cutoff = new Date(Date.now() - LOGIN_RATE_LIMIT_WINDOW_MS);
  await db.delete(loginAttempts).where(sql`${loginAttempts.createdAt} <= ${cutoff}`);
}

export async function getLoginRateLimitState(ip: string, email: string) {
  const ipHash = hashLoginRateLimitValue('ip', ip);
  const emailHash = hashLoginRateLimitValue('email', email);

  const [ipCount, emailCount] = await Promise.all([
    countRecentAttempts('ipHash', ipHash),
    countRecentAttempts('emailHash', emailHash),
  ]);

  return {
    ipHash,
    emailHash,
    counts: { ip: ipCount, email: emailCount },
    limited: isLoginRateLimitExceeded({ ip: ipCount, email: emailCount }),
  };
}

export async function assertLoginAllowed(ip: string, email: string) {
  const state = await getLoginRateLimitState(ip, email);
  return state.limited;
}

export async function recordFailedLoginAttempt(ip: string, email: string) {
  const ipHash = hashLoginRateLimitValue('ip', ip);
  const emailHash = hashLoginRateLimitValue('email', email);

  await db.insert(loginAttempts).values({ ipHash, emailHash });
  await pruneOldAttempts();
}

export async function clearLoginAttemptsForEmail(email: string) {
  const emailHash = hashLoginRateLimitValue('email', email);
  await db.delete(loginAttempts).where(eq(loginAttempts.emailHash, emailHash));
}

/** Stable digest for tests without exposing raw values. */
export function digestLoginRateLimitKey(kind: 'ip' | 'email', value: string): string {
  return createHash('sha256').update(`${kind}:${value.trim().toLowerCase()}`).digest('hex');
}
