import { NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import {
  getUserKeybindings,
  mergeUserKeybindings,
  upsertUserKeybindings,
} from '@/lib/user/keybindings';
import { parseUserKeyOverrides } from '@/lib/keyboard/validate-overrides';
import { parseJsonBody } from '@/lib/validation/http';
import {
  keybindingsDeleteSchema,
  keybindingsPatchSchema,
} from '@/lib/validation/user';

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

  const parsed = await parseJsonBody(req, keybindingsPatchSchema);
  if ('error' in parsed) return parsed.error;
  const body = parsed.data;

  if ('overrides' in body) {
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

  const parsed = await parseJsonBody(req, keybindingsDeleteSchema);
  if ('error' in parsed) return parsed.error;

  const existing = await getUserKeybindings(session.user.id);
  const next = { ...existing };
  delete next[parsed.data.bindingId];
  const saved = await upsertUserKeybindings(session.user.id, next);
  return NextResponse.json({ overrides: saved });
}
