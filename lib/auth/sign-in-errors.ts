import { CredentialsSignin } from 'next-auth';

export class LoginRateLimitedError extends CredentialsSignin {
  code = 'rate_limited';
}

export class DemoLoginDisabledError extends CredentialsSignin {
  code = 'demo_login_disabled';
}

export function getCredentialsSignInErrorMessage(
  error?: string | null,
  code?: string | null
): string {
  if (code === 'rate_limited' || error === 'rate_limited') {
    return 'Too many sign-in attempts. Please wait about 15 minutes and try again.';
  }

  if (code === 'demo_login_disabled' || error === 'demo_login_disabled') {
    return 'Demo login is currently disabled.';
  }

  return 'Invalid email or password';
}

export function getSuspendedAccountMessage(): string {
  return 'This account has been suspended. Contact support if you believe this is a mistake.';
}
