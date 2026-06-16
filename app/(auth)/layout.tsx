import { createPageMetadata } from '@/lib/site/metadata';

export const metadata = createPageMetadata({
  title: 'Sign in',
  description: 'Sign in to Supereye with Google or email and password.',
  path: '/login',
  noIndex: true,
});

/**
 * Auth layout — centered, minimal design.
 * No sidebar or navbar — just the auth form against a gradient background.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background">
      {/* Ambient gradient blobs */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-violet-500/20 via-blue-500/10 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-gradient-to-tl from-cyan-500/20 via-teal-500/10 to-transparent blur-3xl" />

      <div className="relative z-10 w-full max-w-md px-6">{children}</div>
    </div>
  );
}
