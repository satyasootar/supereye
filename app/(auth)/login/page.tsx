import Link from 'next/link';
import { Suspense } from 'react';
import { createPageMetadata } from '@/lib/site/metadata';
import { AuthHeader } from '@/components/auth/auth-header';
import { GoogleAuthButton } from '@/components/auth/google-auth-button';
import { AuthDivider } from '@/components/auth/auth-divider';
import { EmailPasswordLoginForm } from '@/components/auth/email-password-login-form';
import { DemoLoginButton } from '@/components/auth/demo-login-button';
import { LoginAlerts } from '@/components/auth/login-alerts';
import { getPlatformSettings } from '@/lib/platform/settings';

export const metadata = createPageMetadata({
  title: 'Sign in',
  description: 'Sign in to Supereye with Google or email and password.',
  path: '/login',
  noIndex: true,
});

export default async function LoginPage() {
  const { demoLoginEnabled } = await getPlatformSettings();

  return (
    <div className="w-full rounded-2xl border border-border-subtle bg-bg-elevated/90 p-5 shadow-xl backdrop-blur-md sm:p-6">
      <div className="flex flex-col gap-4">
        <AuthHeader title="Sign in" />
        <p className="text-sm text-text-secondary">
          Welcome back. Sign in with Google or your email and password.
        </p>

        <Suspense fallback={null}>
          <LoginAlerts />
        </Suspense>

        <GoogleAuthButton />

        {demoLoginEnabled && <DemoLoginButton />}

        <AuthDivider />

        <EmailPasswordLoginForm />

        <p className="text-center text-xs text-text-muted">
          Google users can add a password in Profile → Security after signing in.
        </p>
        <p className="text-center text-sm text-text-secondary">
          New here?{' '}
          <Link href="/signup" className="font-medium text-accent-blue hover:underline">
            Create an account
          </Link>
        </p>
        <p className="text-center text-xs text-text-muted/80">
          By signing in, you agree to our{' '}
          <Link href="/terms" className="underline underline-offset-2 hover:text-text-secondary">
            Terms
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-text-secondary">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
