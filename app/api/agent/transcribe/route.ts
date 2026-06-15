import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { logAndConsumeAiUsage, checkAiAccess } from '@/lib/billing/usage';
import { tokenErrorResponse } from '@/lib/billing/errors';
import { validateAudioFile } from '@/lib/security/uploads';

export async function POST(req: Request) {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Voice transcription requires OPENAI_API_KEY' },
      { status: 503 }
    );
  }

  try {
    await checkAiAccess(session.user.id);
  } catch (e) {
    const response = tokenErrorResponse(e);
    if (response) return response;
    throw e;
  }

  try {
    const formData = await req.formData();
    const audio = formData.get('audio');
    if (!(audio instanceof Blob) || audio.size === 0) {
      return NextResponse.json({ error: 'No audio received' }, { status: 400 });
    }

    const audioError = validateAudioFile(audio);
    if (audioError) {
      return NextResponse.json({ error: audioError }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey });
    const file = new File([audio], 'voice.webm', { type: audio.type || 'audio/webm' });

    const result = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      language: 'en',
    });

    await logAndConsumeAiUsage(session.user.id, {
      feature: 'transcribe',
      model: 'whisper-1',
      metadata: { audioBytes: audio.size },
    });

    return NextResponse.json({ text: result.text?.trim() ?? '' });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Transcription failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
