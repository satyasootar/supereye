import { NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import {
  getUserKeybindings,
  mergeUserKeybindings,
  upsertUserKeybindings,
} from '@/lib/user/keybindings';
import { parseUserKeyOverrides } from '@/lib/keyboard/validate-overrides';

export async function GET() {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

  const overrides = await getUserKeybindings(session.user.id);
  return NextResponse.json({ overrides });
}

export async function PATCH(req: Request) {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

  const body = await req.json().catch(() => ({}));

  if (body.overrides === undefined && body.merge === undefined) {
    return NextResponse.json(
      { error: 'Provide overrides (full replace) or merge (partial update)' },
      { status: 400 }
    );
  }

  if (body.overrides !== undefined) {
    const overrides = parseUserKeyOverrides(body.overrides);
    const saved = await upsertUserKeybindings(session.user.id, overrides);
    return NextResponse.json({ overrides: saved });
  }

  const merge = parseUserKeyOverrides(body.merge);
  const saved = await mergeUserKeybindings(session.user.id, merge);
  return NextResponse.json({ overrides: saved });
}

export async function DELETE(req: Request) {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

  const body = await req.json().catch(() => ({}));
  if (typeof body.bindingId !== 'string') {
    return NextResponse.json({ error: 'bindingId required' }, { status: 400 });
  }

  const existing = await getUserKeybindings(session.user.id);
  const next = { ...existing };
  delete next[body.bindingId];
  const saved = await upsertUserKeybindings(session.user.id, next);
  return NextResponse.json({ overrides: saved });
}
