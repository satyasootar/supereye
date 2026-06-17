/**
 * Auth layout — centered form only, theme-aware background.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative h-svh overflow-hidden bg-bg-app px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,var(--accent-blue-glow),transparent_50%)]" />
      <div className="relative z-10 mx-auto flex h-full w-full max-w-md items-center">{children}</div>
    </div>
  );
}
