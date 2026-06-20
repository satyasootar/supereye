import { NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { internalErrorResponse } from '@/lib/security/api-errors';
import {
  disconnectIntegration,
  DisconnectIntegrationError,
} from '@/lib/integrations/disconnect';
import { getWorkspaceContext } from '@/lib/workspaces/workspaces';
import { parseJsonBody } from '@/lib/validation/http';
import { integrationsConnectSchema } from '@/lib/validation/integrations';

export async function POST(request: Request) {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

  const parsed = await parseJsonBody(request, integrationsConnectSchema);
  if ('error' in parsed) return parsed.error;

  try {
    const result = await disconnectIntegration(
      session.user.id,
      parsed.data.plugin
    );

    if (!result.disconnected) {
      return NextResponse.json(
        { error: 'Integration is not connected' },
        { status: 404 }
      );
    }

    const workspace = await getWorkspaceContext(session.user.id);
    return NextResponse.json({ ok: true, workspace });
  } catch (error) {
    if (error instanceof DisconnectIntegrationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return internalErrorResponse('Failed to disconnect integration', error);
  }
}
