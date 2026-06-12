import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { emails } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { corsair } from '@/lib/corsair';

export async function GET() {
  try {
    const allEmails = await db.select().from(emails).limit(1);
    if (allEmails.length === 0) return NextResponse.json({ error: 'No emails found' });
    
    const email = allEmails[0];
    const t = corsair.withTenant(email.userId) as any;
    
    const result = await t.gmail.api.messages.modify({
      id: email.googleMessageId,
      removeLabelIds: ['UNREAD']
    });
    
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
