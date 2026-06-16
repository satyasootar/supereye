import { Suspense } from 'react';
import Link from 'next/link';
import { Eye, Loader2 } from 'lucide-react';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';
import { createPageMetadata } from '@/lib/site/metadata';

export const metadata = createPageMetadata({
  title: 'Reset password',
  description: 'Set a new password for your Supereye account.',
  path: '/reset-password',
  noIndex: true,
});

function ResetPasswordFallback() {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Loading…</p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 shadow-lg shadow-violet-500/25">
          <Eye className="h-7 w-7 text-white" />
        </div>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Reset password</h1>
          <p className="text-sm text-muted-foreground">Choose a new password</p>
        </div>
      </div>

      <div className="w-full rounded-2xl border border-border/50 bg-card/80 p-8 shadow-xl shadow-black/5 backdrop-blur-xl">
        <Suspense fallback={<ResetPasswordFallback />}>
          <ResetPasswordForm />
        </Suspense>
      </div>

      <p className="text-center text-xs text-muted-foreground/60">
        <Link href="/login" className="underline underline-offset-2 hover:text-muted-foreground">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
