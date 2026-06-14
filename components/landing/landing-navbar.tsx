'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Moon, Sun, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { AiBot } from '@/components/os/ai-bot';

const NAV_LINKS = [
  { href: '#workspace', label: 'Workspace' },
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#integrations', label: 'Integrations' },
];

export function LandingNavbar({ isLoggedIn }: { isLoggedIn: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full px-4 pt-4 md:px-6">
      <div
        className={cn(
          'mx-auto flex h-14 max-w-6xl items-center justify-between rounded-2xl px-4 transition-all duration-300 md:px-6',
          'bg-bg-elevated/90 backdrop-blur-md landing-float-sm',
          scrolled && 'scale-[0.99]'
        )}
      >
        <div className="flex items-center gap-2.5">
          <AiBot openAgentOnClick={false} hideWhenAgentOpen={false} size="sm" />
          <Link
            href="/"
            className="font-heading text-[15px] font-semibold tracking-tight text-text-primary"
          >
            supereye
          </Link>
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-text-secondary transition-colors hover:bg-bg-highlight/60 hover:text-text-primary"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {mounted && (
            <button
              type="button"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-bg-highlight/60 hover:text-text-primary"
              aria-label="Toggle theme"
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
          )}

          {isLoggedIn ? (
            <Link
              href="/workspace"
              className="landing-btn-primary flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-semibold text-text-inverse transition-all"
            >
              Open workspace
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <Link
              href="/login"
              className="landing-btn-primary flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-semibold text-text-inverse transition-all"
            >
              Get started
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
