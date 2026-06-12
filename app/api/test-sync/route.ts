import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { emails } from '@/lib/db/schema';
import { syncGmailForUser } from '@/lib/mail/sync';

export async function GET() {
  try {
    const allEmails = await db.select().from(emails).limit(1);
    if (allEmails.length === 0) return NextResponse.json({ error: 'No emails found' });
    
    const userId = allEmails[0].userId;
    const result = await syncGmailForUser(userId);
    
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
