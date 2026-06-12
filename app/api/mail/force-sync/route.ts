import { NextResponse } from 'next/server';
import { syncGmailForUser } from '@/lib/mail/sync';
import { db } from '@/lib/db';
import { emails } from '@/lib/db/schema';

export async function GET() {
  const allEmails = await db.select().from(emails).limit(1);
  if (allEmails.length === 0) return NextResponse.json({ error: 'No user' });
  const userId = allEmails[0].userId;
  
  try {
    const result = await syncGmailForUser(userId);
    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
