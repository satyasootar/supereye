import { NextResponse } from 'next/server';
import type { ZodError, ZodType } from 'zod';

export function formatZodError(error: ZodError): string {
  const first = error.issues[0];
  if (!first) return 'Validation failed';
  const path = first.path.length > 0 ? `${first.path.join('.')}: ` : '';
  return `${path}${first.message}`;
}

export function validationErrorResponse(error: ZodError, status = 400) {
  return NextResponse.json(
    {
      error: formatZodError(error),
      issues: error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    },
    { status }
  );
}

export async function parseJsonBody<T>(
  req: Request,
  schema: ZodType<T>
): Promise<{ data: T } | { error: NextResponse }> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return {
      error: NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }),
    };
  }

  const result = schema.safeParse(json);
  if (!result.success) {
    return { error: validationErrorResponse(result.error) };
  }

  return { data: result.data };
}

export function parseQuery<T>(
  url: string | URL,
  schema: ZodType<T>
): { data: T } | { error: NextResponse } {
  const params = Object.fromEntries(new URL(url).searchParams.entries());
  const result = schema.safeParse(params);
  if (!result.success) {
    return { error: validationErrorResponse(result.error) };
  }
  return { data: result.data };
}
