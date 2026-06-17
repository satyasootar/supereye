import Link from 'next/link';
import { createPageMetadata } from '@/lib/site/metadata';
import { AuthHeader } from '@/components/auth/auth-header';
import { GoogleAuthButton } from '@/components/auth/google-auth-button';
import { AuthDivider } from '@/components/auth/auth-divider';
import { EmailPasswordSignupForm } from '@/components/auth/email-password-signup-form';

export const metadata = createPageMetadata({
  title: 'Sign up',
  description: 'Create your Supereye account.',
  path: '/signup',
  noIndex: true,
});

export default function SignupPage() {
  return (
    <div className="w-full rounded-2xl border border-border-subtle bg-bg-elevated/90 p-5 shadow-xl backdrop-blur-md sm:p-6">
      <div className="flex flex-col gap-4">
        <AuthHeader title="Create account" />
        <p className="text-sm text-text-secondary">
          Get started with Google or create an account with email and password.
        </p>

        <GoogleAuthButton id="google-sign-up" />

        <AuthDivider />

        <EmailPasswordSignupForm />

        <p className="text-center text-xs text-text-muted/80">
          By creating an account, you agree to our{' '}
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
