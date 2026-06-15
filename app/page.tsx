import { auth, signOut } from '@/lib/auth';
import { Eye, ArrowRight, LogOut, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

export default async function HomePage() {
  const session = await auth();
  const isLoggedIn = !!session?.user?.id;
  const userEmail = session?.user?.email;

  return (
    <div className="landing-grain relative flex min-h-screen flex-col items-center justify-center bg-bg-app text-text-primary overflow-hidden">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-[10%] -top-[10%] h-[60%] w-[60%] rounded-full bg-accent-blue-glow blur-[140px]" />
        <div className="absolute -bottom-[10%] -right-[10%] h-[50%] w-[50%] rounded-full bg-accent-blue-glow blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center px-4 text-center max-w-2xl mx-auto">
        {/* Logo/Icon */}
        <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-blue to-accent-blue-dim shadow-lg shadow-accent-blue/20 hover:scale-105 transition-transform duration-300">
          <Eye className="h-8 w-8 text-white" />
        </div>

        {/* Hello Text */}
        <h1 className="text-7xl md:text-8xl font-black tracking-tight mb-4 select-none">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-text-primary via-accent-blue to-text-secondary">
            Hello.
          </span>
        </h1>

        {/* Subtitle / Description */}
        <p className="text-lg md:text-xl text-text-secondary max-w-md mb-12 leading-relaxed">
          Welcome to <span className="font-semibold text-accent-blue">Supereye</span>. Your intelligent daily command center.
          {isLoggedIn && (
            <span className="block mt-2 text-sm text-text-muted">
              Logged in as <span className="font-mono text-xs">{userEmail}</span>
            </span>
          )}
        </p>

        {/* Two Buttons Container */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full sm:w-auto">
          {isLoggedIn ? (
            <>
              {/* Button 1: Go to Workspace */}
              <Link
                href="/workspace"
                className="group flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-accent-blue px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-accent-blue/25 transition-all hover:bg-accent-blue-dim hover:shadow-xl active:scale-[0.98]"
              >
                Go to Workspace
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>

              {/* Button 2: Sign Out */}
              <form
                action={async () => {
                  'use server';
                  await signOut({ redirectTo: '/' });
                }}
                className="w-full sm:w-auto"
              >
                <button
                  type="submit"
                  className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-border-default bg-bg-base px-8 py-3.5 text-sm font-semibold text-text-primary transition-all hover:bg-bg-surface hover:border-border-strong active:scale-[0.98]"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </form>
            </>
          ) : (
            <>
              {/* Button 1: Get Started */}
              <Link
                href="/workspace"
                className="group flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-accent-blue px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-accent-blue/25 transition-all hover:bg-accent-blue-dim hover:shadow-xl active:scale-[0.98]"
              >
                Get Started
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>

              {/* Button 2: Sign In */}
              <Link
                href="/login"
                className="group flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-border-default bg-bg-base px-8 py-3.5 text-sm font-semibold text-text-primary transition-all hover:bg-bg-surface hover:border-border-strong active:scale-[0.98]"
              >
                Sign In
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Subtle bottom detail */}
      <div className="absolute bottom-6 left-0 right-0 text-center">
        <p className="text-xs text-text-muted font-medium tracking-wide">
          Supereye Command Center
        </p>
      </div>
    </div>
  );
}
