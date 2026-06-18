import Link from 'next/link';
import { ArrowLeft, Home, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageMetadata } from '@/lib/site/metadata';

export const metadata = createPageMetadata({
  title: 'Page not found',
  description: 'The page you requested does not exist or may have been moved.',
  path: '/404',
  noIndex: true,
});

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg-app px-4 py-16">
      <div className="w-full max-w-md text-center">
        <p className="font-mono text-sm font-medium tracking-widest text-accent-blue">404</p>
        <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
          Page not found
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">
          This route does not match anything in Supereye. The link may be broken, or the page may
          have been moved.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-2 sm:flex-row">
          <Button asChild>
            <Link href="/workspace">
              <LayoutGrid data-icon="inline-start" />
              Go to workspace
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">
              <Home data-icon="inline-start" />
              Back to home
            </Link>
          </Button>
        </div>

        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-1.5 text-xs font-medium text-text-muted transition-colors hover:text-text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Return to landing page
        </Link>
      </div>
    </div>
  );
}
