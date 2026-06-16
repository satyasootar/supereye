import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { generateOAuthUrl } from 'corsair/oauth';
import { validationErrorResponse } from '@/lib/validation/http';
import { integrationsConnectSchema } from '@/lib/validation/integrations';

export async function POST(request: NextRequest) {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

  const contentType = request.headers.get('content-type') ?? '';
  const isFormRequest =
    contentType.includes('application/x-www-form-urlencoded') ||
    contentType.includes('multipart/form-data');
  const body = isFormRequest
    ? await request.formData()
    : await request.json();
  const pluginRaw = body.get
    ? (body.get('plugin') as string | null)
    : (body.plugin as string);

  const pluginParsed = integrationsConnectSchema.safeParse({
    plugin: pluginRaw ?? '',
  });
  if (!pluginParsed.success) {
    return validationErrorResponse(pluginParsed.error);
  }
  const plugin = pluginParsed.data.plugin;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    console.error('NEXT_PUBLIC_APP_URL is not set');
    return Response.json(
      { error: 'App URL not configured. Set NEXT_PUBLIC_APP_URL in .env.local.' },
      { status: 503 }
    );
  }

  try {
    // GitHub is configured as `api_key` (PAT) in Corsair, not OAuth (`oauth_2`).
    // The current UX button still calls this OAuth connect endpoint, so we return
    // a clear remediation message instead of failing with HTTP 500.
    if (plugin === 'github') {
      return NextResponse.json(
        {
          error:
            'GitHub uses a Personal Access Token (api_key), not OAuth. ' +
            `Set it once for this account (tenantId: ${session.user.id}) with: ` +
            'npx corsair setup --plugin=github --tenant <tenantId> api_key=<GITHUB_PAT>',
        },
        { status: 400 }
      );
    }

    const { corsair } = await import('@/lib/corsair');

    const { url: authUrl } = await generateOAuthUrl(corsair, plugin, {
      tenantId: session.user.id,
      redirectUri: `${appUrl}/api/corsair/callback`,
    });

    if (isFormRequest) {
      return NextResponse.redirect(new URL(authUrl), 303);
    }

    return Response.json({ authUrl });
  } catch (error) {
    console.error(`Failed to generate ${plugin} auth URL:`, error);
    const message =
      error instanceof Error ? error.message : 'Failed to generate auth URL';
    return Response.json(
      {
        error:
          message.includes('client_id') || message.includes('credentials')
            ? `${plugin} is not configured. Run: npx corsair setup --${plugin}`
            : 'Failed to generate auth URL',
      },
      { status: 500 }
    );
  }
}
