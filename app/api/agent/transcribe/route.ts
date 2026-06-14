import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { auth } from '@/lib/auth';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Voice transcription requires OPENAI_API_KEY' },
      { status: 503 }
    );
  }

  try {
    const formData = await req.formData();
    const audio = formData.get('audio');
    if (!(audio instanceof Blob) || audio.size === 0) {
      return NextResponse.json({ error: 'No audio received' }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey });
    const file = new File([audio], 'voice.webm', { type: audio.type || 'audio/webm' });

    const result = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      language: 'en',
    });

    return NextResponse.json({ text: result.text?.trim() ?? '' });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Transcription failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
