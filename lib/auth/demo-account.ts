export const DEMO_ACCOUNT_EMAIL = 'kollectstech@gmail.com';

export function isDemoAccountEmail(
  email: string | null | undefined
): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === DEMO_ACCOUNT_EMAIL.toLowerCase();
}
