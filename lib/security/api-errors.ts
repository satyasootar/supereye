import { NextResponse } from 'next/server';

/** Return a generic 500 without leaking internal error messages to clients. */
export function internalErrorResponse(
  userMessage: string,
  error?: unknown,
  status = 500
): NextResponse {
  console.error(userMessage, error);
  return NextResponse.json({ error: userMessage }, { status });
}
