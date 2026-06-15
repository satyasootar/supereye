import { NextResponse } from 'next/server';
import { TokenExhaustedError } from './tokens';
import { AuthorizationError } from './rbac';

export function tokenErrorResponse(error: unknown) {
  if (error instanceof TokenExhaustedError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
      },
      { status: error.status }
    );
  }
  if (error instanceof AuthorizationError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return null;
}
