'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronDown, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LandingSection } from './landing-section';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'What is Supereye?',
    answer: 'Supereye is a keyboard-first, unified workspace that consolidates your email, calendar, and favorite productivity tools (Slack, Notion, GitHub, Vercel, and more) into one intelligent, blazingly fast desktop inbox.',
  },
  {
    question: 'Which email and calendar providers are supported?',
    answer: 'We offer native, two-way sync with Google Workspace (Gmail), Microsoft 365 (Outlook), iCloud, and custom IMAP accounts. Your calendar syncs dynamically side-by-side with your primary inbox so you never double-book.',
  },
  {
    question: 'How does the AI Triage engine work?',
    answer: 'Our local-first AI categorizes incoming emails, surfaces urgent notifications, and drafts smart contextual replies. We do not use your data to train public models, and your inbox credentials remain fully encrypted and secure on your device.',
  },
  {
    question: 'Is it completely keyboard-navigable?',
    answer: 'Yes. Supereye is built with a keyboard-first philosophy. Using our command menu (Cmd+K or Ctrl+K), you can navigate feeds, schedule calendar slots, snooze threads, and trigger integrations without touching your mouse.',
  },
  {
    question: 'Can I connect custom tools and developer platforms?',
    answer: 'Absolutely. Supereye has pre-built integrations for developer and productivity tools, including GitHub, GitLab, Vercel, Linear, Slack, and Notion. You can triage notifications from these platforms directly from your unified inbox feed.',
  },
  {
    question: 'What is your security and privacy policy?',
    answer: 'We take security seriously. See our full Privacy Policy at /privacy for how we handle account data, integrations, and AI features.',
  },
];

export function LandingFaq() {
  const reduceMotion = useReducedMotion();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleIndex = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <LandingSection id="faq" className="bg-bg-app border-t border-border-subtle">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        
        {/* Left column: Section Header & Support Info */}
        <div className="lg:col-span-5 flex flex-col justify-start">
          <p className="mb-3 font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-accent-blue">
            Questions
          </p>
          <h2 className="font-heading text-3xl font-semibold tracking-tight text-text-primary md:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-base leading-relaxed text-text-secondary">
            Everything you need to know about Supereye, unified triaging, and how it transforms your workday.
          </p>
          
          <div className="mt-8 rounded-[var(--radius-2xl)] border border-border-subtle bg-bg-elevated p-6 flex flex-col items-start gap-4">
            <div className="h-10 w-10 rounded-[var(--radius-lg)] bg-[color-mix(in_srgb,var(--accent-blue)_10%,transparent)] flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-accent-blue" />
            </div>
            <div>
              <h4 className="font-heading text-[15px] font-semibold text-text-primary">
                Still have questions?
              </h4>
              <p className="mt-1 text-sm text-text-muted">
                Can\'t find what you\'re looking for? Get in touch with our product support team.
              </p>
            </div>
            <Button variant="outline" size="sm" className="mt-2" asChild>
              <a href="mailto:support@supereye.ai">Contact Support</a>
            </Button>
          </div>
        </div>

        {/* Right column: Interactive Accordions */}
        <div className="lg:col-span-7 space-y-4">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <motion.div
                key={index}
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ duration: 0.4, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
                className={cn(
                  'overflow-hidden rounded-[var(--radius-xl)] border bg-bg-elevated transition-all duration-300',
                  isOpen
                    ? 'border-[color-mix(in_srgb,var(--accent-blue)_40%,transparent)] shadow-[0_4px_20px_color-mix(in_srgb,var(--accent-blue)_4%,transparent)]'
                    : 'border-border-subtle hover:border-[color-mix(in_srgb,var(--accent-blue)_20%,transparent)]'
                )}
              >
                <button
                  type="button"
                  onClick={() => toggleIndex(index)}
                  className="flex w-full items-center justify-between px-6 py-5 text-left font-medium select-none cursor-pointer focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <span className="font-heading text-base font-medium text-text-primary pr-4">
                    {item.question}
                  </span>
                  <ChevronDown
                    className={cn(
                      'h-4.5 w-4.5 shrink-0 text-text-muted transition-transform duration-300',
                      isOpen && 'rotate-180 text-accent-blue'
                    )}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={reduceMotion ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
                      animate={reduceMotion ? { height: 'auto', opacity: 1 } : { height: 'auto', opacity: 1 }}
                      exit={reduceMotion ? { height: 0, opacity: 0 } : { height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: [0.04, 0.62, 0.23, 0.98] }}
                    >
                      <div className="border-t border-border-subtle/50 px-6 py-4.5 text-[14px] leading-relaxed text-text-secondary bg-bg-app/30">
                        {item.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

      </div>
    </LandingSection>
  );
}
