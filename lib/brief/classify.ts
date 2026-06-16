import type { EmailInsightCategory } from './types';
import { extractMeetingLinks, extractOtps } from './extract-links';
import { stripHtml } from '@/lib/mail/priority';

const BANK_SENDER =
  /\b(bank|chase|wells\s*fargo|bofa|citibank|capital\s*one|amex|paypal|stripe|venmo|wise|revolut|hsbc|barclays)\b/i;

const BANK_SUBJECT =
  /\b(statement|transaction|payment|transfer|deposit|withdrawal|balance|invoice|receipt|charged|debit|credit)\b/i;

const DELIVERY_SUBJECT =
  /\b(shipped|delivery|tracking|out for delivery|package|fedex|ups|usps|dhl|amazon)\b/i;

const MEETING_SUBJECT =
  /\b(meeting|invite|calendar|standup|sync|call|interview|zoom|teams)\b/i;

const NEWSLETTER_HINT =
  /\b(newsletter|unsubscribe|weekly digest|promo|sale|%\s*off)\b/i;

type ClassifyInput = {
  subject: string;
  from: string;
  snippet: string;
  body: string;
};

export function classifyEmailInsight(input: ClassifyInput): {
  category: EmailInsightCategory;
  summary: string;
  links: ReturnType<typeof extractMeetingLinks>;
  otps: ReturnType<typeof extractOtps>;
} {
  const subject = input.subject || '';
  const from = input.from || '';
  const plainBody = stripHtml(input.body || input.snippet || '');
  const text = `${subject}\n${from}\n${plainBody}`.toLowerCase();

  const links = extractMeetingLinks(`${subject}\n${plainBody}\n${input.snippet}`);
  const otps = extractOtps(subject, plainBody);

  if (otps.length > 0) {
    return {
      category: 'otp',
      summary: `Verification code from ${formatSender(from)}`,
      links,
      otps,
    };
  }

  if (links.length > 0 || MEETING_SUBJECT.test(subject) || MEETING_SUBJECT.test(plainBody.slice(0, 300))) {
    return {
      category: 'meeting',
      summary: links[0]
        ? `Meeting link: ${links[0].label ?? 'Join'}`
        : `Meeting invite from ${formatSender(from)}`,
      links,
      otps,
    };
  }

  if (BANK_SENDER.test(from) || BANK_SUBJECT.test(subject) || BANK_SUBJECT.test(plainBody.slice(0, 200))) {
    return {
      category: 'bank',
      summary: subject || `Financial update from ${formatSender(from)}`,
      links,
      otps,
    };
  }

  if (DELIVERY_SUBJECT.test(subject) || DELIVERY_SUBJECT.test(plainBody.slice(0, 200))) {
    return {
      category: 'delivery',
      summary: subject || `Delivery update from ${formatSender(from)}`,
      links,
      otps,
    };
  }

  if (/\binvoice\b/i.test(subject)) {
    return {
      category: 'invoice',
      summary: subject,
      links,
      otps,
    };
  }

  if (NEWSLETTER_HINT.test(text)) {
    return {
      category: 'newsletter',
      summary: subject || 'Newsletter',
      links,
      otps,
    };
  }

  if (/\b(linkedin|twitter|facebook|instagram)\b/i.test(from)) {
    return {
      category: 'social',
      summary: subject || `Social notification`,
      links,
      otps,
    };
  }

  if (
    /\b(reply|action required|please confirm|deadline|urgent|asap|waiting for)\b/i.test(
      `${subject} ${plainBody.slice(0, 400)}`
    )
  ) {
    return {
      category: 'action_required',
      summary: subject || `Action needed from ${formatSender(from)}`,
      links,
      otps,
    };
  }

  return {
    category: 'fyi',
    summary: subject || `Message from ${formatSender(from)}`,
    links,
    otps,
  };
}

function formatSender(from: string): string {
  const match = from.match(/^([^<]+)</);
  if (match?.[1]) return match[1].trim().replace(/"/g, '');
  const emailMatch = from.match(/<([^>]+)>/);
  return emailMatch?.[1] ?? from.split('@')[0] ?? 'sender';
}
