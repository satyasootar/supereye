import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { emails } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const id = params.id;
    
    // Fetch from our local DB cache first
    const emailData = await db.query.emails.findFirst({
      where: eq(emails.googleMessageId, id)
    });

    if (!emailData) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    return NextResponse.json({ message: emailData });
  } catch (error: any) {
    console.error('Failed to fetch email:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch email',
      details: error?.message 
    }, { status: 500 });
  }
}
