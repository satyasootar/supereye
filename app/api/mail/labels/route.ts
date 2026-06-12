import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getTenant } from '@/lib/corsair';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const t = getTenant(session.user.id);
    
    // Fetch labels from Gmail
    const response = await t.gmail.api.labels.list();
    const labels = response.labels || [];
    
    // Sort so SYSTEM labels are first, then user labels alphabetically
    labels.sort((a: any, b: any) => {
      if (a.type === 'system' && b.type !== 'system') return -1;
      if (a.type !== 'system' && b.type === 'system') return 1;
      return (a.name || '').localeCompare(b.name || '');
    });

    return NextResponse.json({ labels });
  } catch (error: any) {
    console.error('Failed to fetch labels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch labels', details: error.message },
      { status: 500 }
    );
  }
}
