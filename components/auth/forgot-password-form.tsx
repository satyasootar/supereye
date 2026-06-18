'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, ArrowLeft, MailCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { emailSchema } from '@/lib/validation/common';
import { normalizeUserEmail } from '@/lib/auth/normalize-email';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const emailCheck = emailSchema.safeParse(email);
    if (!emailCheck.success) {
      setError(emailCheck.error.issues[0]?.message ?? 'Invalid email');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizeUserEmail(emailCheck.data) }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Could not send reset email. Try again.');
        return;
      }

      setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
          <MailCheck className="h-7 w-7" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Check your email</h2>
          <p className="text-sm text-muted-foreground">
            If an account exists for <strong className="text-foreground">{email}</strong>, we sent a
            password reset link. The link expires in one hour.
          </p>
        </div>
        <Button asChild variant="outline" className="mt-2">
          <Link href="/login">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to sign in
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Enter the email for your account. We&apos;ll send a link to reset your password.
      </p>

      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending…
          </>
        ) : (
          'Send reset link'
        )}
      </Button>

      <Button asChild variant="ghost" className="w-full">
        <Link href="/login">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to sign in
        </Link>
      </Button>
    </form>
  );
}
