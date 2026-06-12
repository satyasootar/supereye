/**
 * Centralized error handler for Corsair API operations.
 *
 * When the AI calls multiple Corsair tools in sequence (check calendar →
 * find conflict → send email → create event → notify on Slack), we need
 * structured error handling so each failure mode gets the right response.
 *
 * Usage in API routes:
 *   import { handleCorsairError } from '@/lib/corsair-error';
 *
 *   try {
 *     const t = getTenant(userId);
 *     await t.gmail.api.messages.send({ ... });
 *   } catch (error) {
 *     const result = handleCorsairError(error);
 *     return NextResponse.json(result, { status: result.status });
 *   }
 */

export type CorsairErrorResult = {
  error: string;
  code: 'AUTH_EXPIRED' | 'RATE_LIMITED' | 'NOT_FOUND' | 'PERMISSION_DENIED' | 'UNKNOWN';
  status: number;
  retryable: boolean;
};

export function handleCorsairError(error: unknown): CorsairErrorResult {
  // Handle Corsair-specific errors (they have a status property)
  if (error && typeof error === 'object' && 'status' in error) {
    const err = error as { status: number; message?: string };

    switch (err.status) {
      case 401:
        return {
          error: 'Your account connection has expired. Please reconnect.',
          code: 'AUTH_EXPIRED',
          status: 401,
          retryable: false,
        };
      case 403:
        return {
          error: 'Permission denied. The app may need additional scopes.',
          code: 'PERMISSION_DENIED',
          status: 403,
          retryable: false,
        };
      case 404:
        return {
          error: 'The requested resource was not found.',
          code: 'NOT_FOUND',
          status: 404,
          retryable: false,
        };
      case 429:
        return {
          error: 'Rate limited by the provider. Please try again in a moment.',
          code: 'RATE_LIMITED',
          status: 429,
          retryable: true,
        };
    }
  }

  // Fallback for unknown errors
  const message = error instanceof Error ? error.message : String(error);
  console.error('[Corsair Error]', message);

  return {
    error: message,
    code: 'UNKNOWN',
    status: 500,
    retryable: false,
  };
}
