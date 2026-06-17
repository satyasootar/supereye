import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { generateOAuthUrl } from 'corsair/oauth';
import { getOAuthCallbackUri } from '@/lib/corsair/oauth-callback';
import { validationErrorResponse } from '@/lib/validation/http';
import { integrationsConnectSchema } from '@/lib/validation/integrations';

function integrationSetupError(plugin: string): string {
  if (plugin === 'googledrive') {
    return (
      'Google Drive is not configured. Set AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET ' +
      '(same Google OAuth app as Gmail/Calendar) and enable the Drive API in Google Cloud Console.'
    );
  }
  if (plugin === 'github') {
    return (
      'GitHub OAuth is not configured. Create a GitHub OAuth App and set ' +
      'GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in your environment.'
    );
  }
  return `${plugin} is not configured. Check your server environment and Corsair integration setup.`;
}

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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');
  if (!appUrl) {
    console.error('NEXT_PUBLIC_APP_URL is not set');
    return Response.json(
      { error: 'App URL not configured. Set NEXT_PUBLIC_APP_URL in .env.local.' },
      { status: 503 }
    );
  }

  try {
    const { corsair } = await import('@/lib/corsair');

    const { url: authUrl } = await generateOAuthUrl(corsair, plugin, {
      tenantId: session.user.id,
      redirectUri: getOAuthCallbackUri(),
    });

    if (isFormRequest) {
      return NextResponse.redirect(new URL(authUrl), 303);
    }

    return Response.json({ authUrl });
  } catch (error) {
    console.error(`Failed to generate ${plugin} auth URL:`, error);
    const message =
      error instanceof Error ? error.message : 'Failed to generate auth URL';
    return NextResponse.json(
      {
        error:
          message.includes('client_id') || message.includes('credentials')
            ? integrationSetupError(plugin)
            : 'Failed to generate auth URL',
      },
      { status: 500 }
    );
  }
}
