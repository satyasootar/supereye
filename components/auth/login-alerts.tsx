'use client';

import { useSearchParams } from 'next/navigation';
import { getSuspendedAccountMessage } from '@/lib/auth/sign-in-errors';

export function LoginAlerts() {
  const searchParams = useSearchParams();
  const suspended = searchParams.get('suspended') === '1';

  if (!suspended) return null;

  return (
    <p
      className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
      role="alert"
    >
      {getSuspendedAccountMessage()}
    </p>
  );
}
