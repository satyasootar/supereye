import { db } from '@/lib/db';
import { calendarEvents, emails } from '@/lib/db/schema';
import { and, desc, eq, gte } from 'drizzle-orm';

export type ContactSuggestion = {
  email: string;
  name: string;
  source: 'email' | 'calendar';
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseAddress(raw: string | null | undefined): ContactSuggestion | null {
  if (!raw?.trim()) return null;
  const match = raw.match(/(?:(.*)\s+)?<([^>]+)>/);
  if (match) {
    const email = match[2].trim().toLowerCase();
    const name = (match[1]?.replace(/["']/g, '').trim() || email).trim();
    return EMAIL_RE.test(email) ? { email, name, source: 'email' } : null;
  }
  const cleaned = raw.replace(/[<>]/g, '').trim().toLowerCase();
  return EMAIL_RE.test(cleaned)
    ? { email: cleaned, name: cleaned, source: 'email' }
    : null;
}

function addContact(
  map: Map<string, ContactSuggestion & { score: number }>,
  contact: ContactSuggestion | null,
  weight: number
) {
  if (!contact) return;
  const existing = map.get(contact.email);
  if (existing) {
    existing.score += weight;
    if (contact.name && contact.name !== contact.email && existing.name === existing.email) {
      existing.name = contact.name;
    }
  } else {
    map.set(contact.email, { ...contact, score: weight });
  }
}

export async function getContactSuggestions(
  userId: string,
  query: string,
  limit = 12
): Promise<ContactSuggestion[]> {
  const since = new Date();
  since.setDate(since.getDate() - 90);

  const [emailRows, eventRows] = await Promise.all([
    db
      .select({
        fromAddress: emails.fromAddress,
        fromName: emails.fromName,
        toAddresses: emails.toAddresses,
        ccAddresses: emails.ccAddresses,
      })
      .from(emails)
      .where(and(eq(emails.userId, userId), gte(emails.internalDate, since)))
      .orderBy(desc(emails.internalDate))
      .limit(400),
    db
      .select({ attendees: calendarEvents.attendees })
      .from(calendarEvents)
      .where(
        and(eq(calendarEvents.userId, userId), gte(calendarEvents.startTime, since))
      )
      .orderBy(desc(calendarEvents.startTime))
      .limit(100),
  ]);

  const map = new Map<string, ContactSuggestion & { score: number }>();

  for (const row of emailRows) {
    const fromContact =
      row.fromAddress && EMAIL_RE.test(row.fromAddress.toLowerCase())
        ? {
            email: row.fromAddress.toLowerCase(),
            name: row.fromName?.trim() || row.fromAddress,
            source: 'email' as const,
          }
        : parseAddress(row.fromAddress);
    addContact(map, fromContact, 2);

    for (const addr of row.toAddresses ?? []) {
      if (addr.email) {
        addContact(map, {
          email: addr.email.toLowerCase(),
          name: addr.name?.trim() || addr.email,
          source: 'email',
        }, 1);
      }
    }

    for (const addr of row.ccAddresses ?? []) {
      if (addr.email) {
        addContact(map, {
          email: addr.email.toLowerCase(),
          name: addr.name?.trim() || addr.email,
          source: 'email',
        }, 1);
      }
    }
  }

  for (const row of eventRows) {
    for (const attendee of row.attendees ?? []) {
      if (!attendee.email) continue;
      addContact(map, {
        email: attendee.email.toLowerCase(),
        name: attendee.displayName?.trim() || attendee.email,
        source: 'calendar',
      }, 3);
    }
  }

  const normalizedQuery = query.trim().toLowerCase();

  return Array.from(map.values())
    .filter((c) => {
      if (!normalizedQuery) return true;
      return (
        c.email.includes(normalizedQuery) ||
        c.name.toLowerCase().includes(normalizedQuery)
      );
    })
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, limit)
    .map(({ email, name, source }) => ({ email, name, source }));
}
