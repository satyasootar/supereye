import type { ExtractedLink, ExtractedOtp } from './types';

const MEET_PATTERNS: { type: ExtractedLink['type']; regex: RegExp }[] = [
  {
    type: 'google_meet',
    regex: /https?:\/\/meet\.google\.com\/[a-z0-9-]+/gi,
  },
  {
    type: 'zoom',
    regex: /https?:\/\/(?:[\w.-]+\.)?zoom\.us\/(?:j|my)\/\d+[^\s<>"']*/gi,
  },
  {
    type: 'teams',
    regex: /https?:\/\/teams\.microsoft\.com\/l\/meetup-join\/[^\s<>"']+/gi,
  },
  {
    type: 'webex',
    regex: /https?:\/\/[^\s<>"']*webex\.com\/[^\s<>"']+/gi,
  },
];

const OTP_CONTEXT =
  /(?:verification|confirm|security|login|sign[- ]?in|one[- ]?time|otp|passcode|auth(?:entication)?)\s*(?:code)?/i;

const OTP_CODE = /\b(\d{4,8})\b/g;

export function extractMeetingLinks(text: string): ExtractedLink[] {
  const found = new Map<string, ExtractedLink>();

  for (const { type, regex } of MEET_PATTERNS) {
    const matches = text.match(regex) ?? [];
    for (const url of matches) {
      const clean = url.replace(/[.,;:!?)]+$/, '');
      if (!found.has(clean)) {
        found.set(clean, {
          type,
          url: clean,
          label:
            type === 'google_meet'
              ? 'Google Meet'
              : type === 'zoom'
                ? 'Zoom'
                : type === 'teams'
                  ? 'Microsoft Teams'
                  : type === 'webex'
                    ? 'Webex'
                    : 'Join link',
        });
      }
    }
  }

  return [...found.values()];
}

export function extractOtps(subject: string, body: string): ExtractedOtp[] {
  const combined = `${subject}\n${body}`;
  if (!OTP_CONTEXT.test(combined)) return [];

  const results: ExtractedOtp[] = [];
  const seen = new Set<string>();

  for (const line of combined.split('\n')) {
    if (!OTP_CONTEXT.test(line)) continue;
    const codes = line.match(OTP_CODE) ?? [];
    for (const code of codes) {
      if (seen.has(code)) continue;
      seen.add(code);
      results.push({ code, label: 'Verification code' });
    }
  }

  return results.slice(0, 3);
}

export function extractMeetUrlFromLocation(location: string | null | undefined): string | null {
  if (!location) return null;
  const links = extractMeetingLinks(location);
  return links[0]?.url ?? null;
}
