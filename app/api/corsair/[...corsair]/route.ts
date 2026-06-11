/**
 * Corsair OAuth callback handler.
 * When a user connects Gmail or Calendar via Corsair's OAuth flow,
 * Google redirects back to this route. Corsair automatically
 * extracts tokens and saves them to the corsair_accounts table.
 */
import { corsair } from '@/lib/corsair';
import { toNextJsHandler } from 'corsair';

const handler = toNextJsHandler(corsair);

export const GET = handler.GET;
export const POST = handler.POST;
