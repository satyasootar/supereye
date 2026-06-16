import Link from 'next/link';
import { Eye } from 'lucide-react';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import { createPageMetadata } from '@/lib/site/metadata';

export const metadata = createPageMetadata({
  title: 'Forgot password',
  description: 'Request a password reset link for your Supereye account.',
  path: '/forgot-password',
  noIndex: true,
});

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 shadow-lg shadow-violet-500/25">
          <Eye className="h-7 w-7 text-white" />
        </div>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Forgot password</h1>
          <p className="text-sm text-muted-foreground">We&apos;ll email you a reset link</p>
        </div>
      </div>

      <div className="w-full rounded-2xl border border-border/50 bg-card/80 p-8 shadow-xl shadow-black/5 backdrop-blur-xl">
        <ForgotPasswordForm />
      </div>

      <p className="text-center text-xs text-muted-foreground/60">
        Remember your password?{' '}
        <Link href="/login" className="underline underline-offset-2 hover:text-muted-foreground">
          Sign in
        </Link>
      </p>
    </div>
  );
}
