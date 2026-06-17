'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Info, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BorderBeam } from '@/components/ui/border-beam';
import { DEMO_ACCOUNT_EMAIL } from '@/lib/auth/demo-account';

const DEMO_EMAIL = DEMO_ACCOUNT_EMAIL;
const DEMO_PASSWORD = 'Kollects@123';

const DEMO_INFO = `By clicking you will be logged in with "${DEMO_EMAIL}" and password "${DEMO_PASSWORD}". This is a demo account for you to explore and experience the page without giving your credentials.`;

export function DemoLoginButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDemoLogin = async () => {
    setError(null);
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        redirect: false,
      });

      if (result?.error) {
        setError('Demo login is unavailable right now. Please try again later.');
        return;
      }

      router.push('/workspace/onboarding');
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        className={cn(
          'relative w-full rounded-lg',
          !loading && 'shadow-[0_0_20px_var(--accent-blue-glow)]'
        )}
      >
        {!loading && (
          <BorderBeam size={120} duration={8} borderWidth={2} anchor={90} />
        )}

        <button
          type="button"
          onClick={handleDemoLogin}
          disabled={loading}
          className={cn(
            'relative z-10 flex h-10 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium text-text-primary transition-all',
            'border border-border-subtle bg-bg-surface',
            'hover:border-border-strong hover:bg-bg-highlight/50',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
        >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          <>
            <span>Demo login</span>
            <span
              className="group/info relative inline-flex shrink-0"
              tabIndex={0}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <Info
                className="h-4 w-4 text-text-muted transition-colors group-hover/info:text-text-secondary"
                aria-label="Demo account details"
              />
              <span
                role="tooltip"
                className={cn(
                  'pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-50 w-[min(18rem,calc(100vw-3rem))] -translate-x-1/2',
                  'rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2.5 text-left text-xs font-normal leading-relaxed text-text-secondary shadow-lg',
                  'opacity-0 transition-opacity duration-150',
                  'group-hover/info:opacity-100 group-focus-within/info:opacity-100'
                )}
              >
                {DEMO_INFO}
              </span>
            </span>
          </>
        )}
        </button>
      </div>

      {error && (
        <p
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
