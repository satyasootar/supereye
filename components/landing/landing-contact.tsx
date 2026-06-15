'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Mail, MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LandingSection, SectionHeader } from './landing-section';

export function LandingContact() {
  const reduceMotion = useReducedMotion();

  return (
    <LandingSection
      id="contact"
      className="border-t border-border-subtle bg-bg-surface/50"
    >
      <div className="grid gap-12 md:grid-cols-2 md:gap-16">
        <SectionHeader
          align="left"
          eyebrow="Contact"
          title="Questions? We'd love to hear from you."
          description="Whether you're evaluating Supereye for your team or need help getting set up, reach out and we'll get back within one business day."
          className="mb-0 md:mb-0"
        />

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-6"
        >
          <div className="flex flex-col gap-4 sm:flex-row">
            <a
              href="mailto:hello@supereye.app"
              className="flex flex-1 items-center gap-3 rounded-xl border border-border-subtle bg-bg-elevated p-4 transition-colors hover:border-[color-mix(in_srgb,var(--accent-blue)_35%,transparent)]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-bg-highlight text-accent-blue">
                <Mail className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[13px] font-medium text-text-primary">Email us</p>
                <p className="text-[12px] text-text-muted">hello@supereye.app</p>
              </div>
            </a>
            <div className="flex flex-1 items-center gap-3 rounded-xl border border-border-subtle bg-bg-elevated p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-bg-highlight text-accent-blue">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[13px] font-medium text-text-primary">Response time</p>
                <p className="text-[12px] text-text-muted">Within 24 hours</p>
              </div>
            </div>
          </div>

          <form
            className="rounded-2xl border border-border-subtle bg-bg-elevated p-6"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="contact-name" className="text-[13px] font-medium text-text-primary">
                  Name
                </label>
                <Input id="contact-name" placeholder="Your name" className="bg-bg-app" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="contact-email" className="text-[13px] font-medium text-text-primary">
                  Email
                </label>
                <Input
                  id="contact-email"
                  type="email"
                  placeholder="you@company.com"
                  className="bg-bg-app"
                />
              </div>
            </div>
            <div className="mt-4 space-y-1.5">
              <label htmlFor="contact-message" className="text-[13px] font-medium text-text-primary">
                Message
              </label>
              <Textarea
                id="contact-message"
                placeholder="Tell us about your workflow or team size…"
                rows={4}
                className="resize-none bg-bg-app"
              />
            </div>
            <Button type="submit" className="mt-5 gap-2" size="lg">
              <Send className="h-4 w-4" />
              Send message
            </Button>
          </form>
        </motion.div>
      </div>
    </LandingSection>
  );
}
