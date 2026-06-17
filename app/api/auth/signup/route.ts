import { NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { hashPassword, validatePassword } from '@/lib/auth/password';
import { getUserByEmail } from '@/lib/auth/credentials';
import { parseJsonBody } from '@/lib/validation/http';

const signupSchema = z.object({
  name: z.string().trim().max(80).optional(),
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const parsed = await parseJsonBody(req, signupSchema);
  if ('error' in parsed) return parsed.error;

  const normalizedEmail = parsed.data.email.trim().toLowerCase();
  const passwordError = validatePassword(parsed.data.password);
  if (passwordError) {
    return NextResponse.json({ error: passwordError }, { status: 400 });
  }

  const existing = await getUserByEmail(normalizedEmail);

  if (existing?.passwordHash) {
    return NextResponse.json(
      { error: 'An account with this email already exists. Please sign in.' },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const name = parsed.data.name?.trim() || null;

  if (existing) {
    await db
      .update(users)
      .set({
        passwordHash,
        name: existing.name ?? name,
        updatedAt: new Date(),
      })
      .where(eq(users.id, existing.id));

    return NextResponse.json({ ok: true, mode: 'updated' });
  }

  try {
    await db.insert(users).values({
      email: normalizedEmail,
      name,
      passwordHash,
    });
    return NextResponse.json({ ok: true, mode: 'created' }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Unable to create account. Please try again.' },
      { status: 500 }
    );
  }
}
