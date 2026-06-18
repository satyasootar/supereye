import { NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { internalErrorResponse } from '@/lib/security/api-errors';
import { getTenant } from '@/lib/corsair';

export async function GET(req: Request) {
  try {
    const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

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
  } catch (error: unknown) {
    return internalErrorResponse('Failed to fetch labels', error);
  }
}
