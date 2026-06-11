import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { emails, calendarEvents, emailEventLinks } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { sseEmitter } from '@/lib/sse/emitter';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const body = await req.json();
    const { emailId: googleMessageId, title, description, startTime, endTime, attendees } = body;

    const { corsair } = await import('@/lib/corsair');
    const t = corsair.withTenant(userId) as any;

    // 1. Create the event in Google Calendar
    const eventPayload = {
      calendarId: 'primary',
      requestBody: {
        summary: title,
        description: description,
        start: { dateTime: new Date(startTime).toISOString() },
        end: { dateTime: new Date(endTime).toISOString() },
        attendees: attendees?.map((email: string) => ({ email })) || []
      }
    };

    const gCalResult = await t.googlecalendar.api.events.create(eventPayload);
    const googleEventId = gCalResult.id;

    // 2. Lookup the local email record
    const [localEmail] = await db.select()
      .from(emails)
      .where(and(eq(emails.userId, userId), eq(emails.googleMessageId, googleMessageId)))
      .limit(1);

    if (!localEmail) {
      console.warn(`Local email not found for googleMessageId: ${googleMessageId}`);
    }

    // 3. Upsert the local calendar_events record to ensure we have a local ID immediately
    const [localEvent] = await db.insert(calendarEvents).values({
      userId,
      googleEventId,
      calendarId: 'primary',
      title: gCalResult.summary,
      description: gCalResult.description,
      location: gCalResult.location,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      status: gCalResult.status || 'confirmed',
      htmlLink: gCalResult.htmlLink,
      sourceEmailId: localEmail?.id || null, // Best effort
    }).onConflictDoUpdate({
      target: [calendarEvents.userId, calendarEvents.googleEventId],
      set: {
        title: gCalResult.summary,
        description: gCalResult.description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        htmlLink: gCalResult.htmlLink,
      }
    }).returning();

    // 4. Insert the link in email_event_links
    if (localEmail && localEvent) {
      await db.insert(emailEventLinks).values({
        emailId: localEmail.id,
        eventId: localEvent.id
      }).onConflictDoNothing(); // If it already exists, that's fine
    }

    // 5. Emit SSE to refresh the UI
    sseEmitter.emit(userId, { type: 'calendar:updated' });
    sseEmitter.emit(userId, { type: 'email:updated' });

    return NextResponse.json({ success: true, event: gCalResult });
  } catch (error: any) {
    console.error('Create calendar event from email error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
