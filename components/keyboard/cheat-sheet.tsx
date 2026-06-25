'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useKeyboardStore } from '@/lib/keyboard/keyboard-store';
import {
  ShortcutsReference,
  ShortcutsFooterHint,
} from '@/components/keyboard/shortcuts-reference';
import { Button } from '@/components/ui/button';

export function CheatSheet() {
  const { isCheatSheetOpen, setCheatSheetOpen } = useKeyboardStore();

  return (
    <AnimatePresence>
      {isCheatSheetOpen && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setCheatSheetOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            className="relative max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-border-default bg-bg-elevated shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
              <div>
                <h2 className="text-[15px] font-semibold text-text-primary">
                  Keyboard shortcuts
                </h2>
                <p className="mt-0.5 text-[12px] text-text-muted">
                  <kbd className="rounded bg-bg-highlight px-1 font-mono">Ctrl</kbd> on Windows,{' '}
                  <kbd className="rounded bg-bg-highlight px-1 font-mono">⌘</kbd> on Mac for modifier
                  shortcuts
                </p>
              </div>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => setCheatSheetOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="custom-scrollbar overflow-y-auto px-5 py-4">
              <ShortcutsReference />
            </div>
            <div className="flex flex-col gap-2 border-t border-border-subtle px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
              <ShortcutsFooterHint />
              <Link
                href="/workspace/profile?tab=shortcuts"
                onClick={() => setCheatSheetOpen(false)}
                className="shrink-0 text-[12px] font-medium text-accent-blue hover:underline"
              >
                Customize shortcuts →
              </Link>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
