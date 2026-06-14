'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type SpeechRecognitionCtor = new () => SpeechRecognition;
type VoiceMode = 'webspeech' | 'whisper';

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function resolveSpeechLang() {
  if (typeof navigator === 'undefined') return 'en-US';
  const lang = navigator.language || 'en-US';
  // Chrome speech works most reliably with en-US; en-IN often fails silently
  if (lang.startsWith('en')) return 'en-US';
  return lang;
}

function mapSpeechError(error: string): string {
  switch (error) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone access blocked. Allow mic permission for this site.';
    case 'network':
      return 'Voice needs an internet connection (Chrome uses Google speech servers).';
    case 'audio-capture':
      return 'No microphone found. Check your audio device.';
    case 'no-speech':
      return 'No speech detected. Try speaking closer to the mic.';
    default:
      return `Voice error: ${error}`;
  }
}

export type VoiceInputState = {
  isListening: boolean;
  isSupported: boolean;
  isProcessing: boolean;
  audioLevel: number;
  elapsedSec: number;
  error: string | null;
  mode: VoiceMode | null;
  start: (prefix: string) => void;
  stop: () => void;
  cancel: () => void;
  confirm: () => void;
};

export function useVoiceInput(
  onTranscript: (prefix: string, spoken: string) => void
): VoiceInputState {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<VoiceMode | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const prefixRef = useRef('');
  const baseTextRef = useRef('');
  const finalsRef = useRef('');
  const onTranscriptRef = useRef(onTranscript);
  const activeRef = useRef(false);
  const intentionalStopRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number>(0);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  const bumpLevel = useCallback((level: number) => {
    setAudioLevel((prev) => Math.max(prev, level));
  }, []);

  const startLevelDecay = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    const tick = () => {
      setAudioLevel((prev) => Math.max(0.08, prev * 0.9));
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    cancelAnimationFrame(rafRef.current);
    setElapsedSec(0);
    setAudioLevel(0);
  }, []);

  const cleanupStream = useCallback(() => {
    recorderRef.current = null;
    chunksRef.current = [];
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    void audioCtxRef.current?.close();
    audioCtxRef.current = null;
  }, []);

  const fullStop = useCallback(() => {
    activeRef.current = false;
    intentionalStopRef.current = true;
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop();
    }
    stopTimer();
    cleanupStream();
    setIsListening(false);
    setIsProcessing(false);
    setMode(null);
  }, [cleanupStream, stopTimer]);

  const startTimer = useCallback(() => {
    startedAtRef.current = Date.now();
    setElapsedSec(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 250);
    startLevelDecay();
  }, [startLevelDecay]);

  const emitTranscript = useCallback((spoken: string) => {
    const text = spoken.trim();
    if (!text) return;
    bumpLevel(0.85);
    onTranscriptRef.current(prefixRef.current, text);
  }, [bumpLevel]);

  const startWhisperCapture = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const bins = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(bins);
        let sum = 0;
        for (let i = 0; i < bins.length; i++) sum += bins[i];
        setAudioLevel(sum / bins.length / 255);
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start(200);
      recorderRef.current = recorder;

      setMode('whisper');
      setIsListening(true);
      setError(null);
    } catch {
      setError('Microphone access denied. Allow mic permission and retry.');
      activeRef.current = false;
      setIsListening(false);
    }
  }, []);

  const attachWebSpeech = useCallback(() => {
    const Ctor = getSpeechRecognition();
    if (!Ctor || !activeRef.current) return;

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = resolveSpeechLang();

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      bumpLevel(0.2);
    };

    recognition.onaudiostart = () => bumpLevel(0.35);
    recognition.onspeechstart = () => bumpLevel(0.75);
    recognition.onsoundstart = () => bumpLevel(0.55);

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const chunk = result[0]?.transcript ?? '';
        if (result.isFinal) finalsRef.current += chunk;
        else interim += chunk;
      }
      emitTranscript(finalsRef.current + interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'aborted') return;
      if (event.error === 'no-speech') return;

      const message = mapSpeechError(event.error);
      recognitionRef.current = null;

      if (event.error === 'network' && typeof MediaRecorder !== 'undefined') {
        setError('Switching to server transcription — keep speaking, then tap ✓');
        void startWhisperCapture();
        return;
      }

      setError(message);
      activeRef.current = false;
      setIsListening(false);
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      if (activeRef.current && !intentionalStopRef.current) {
        window.setTimeout(() => {
          if (activeRef.current && !intentionalStopRef.current) {
            attachWebSpeech();
          }
        }, 120);
        return;
      }
      if (!recorderRef.current) {
        setIsListening(false);
        stopTimer();
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setError('Could not start voice recognition. Try again.');
      setIsListening(false);
      activeRef.current = false;
    }
  }, [bumpLevel, emitTranscript, startWhisperCapture, stopTimer]);

  const transcribeRecording = useCallback(async () => {
    const recorder = recorderRef.current;
    if (!recorder || chunksRef.current.length === 0) {
      setError('No audio recorded.');
      return;
    }

    setIsProcessing(true);
    setIsListening(false);

    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
      if (recorder.state === 'recording') recorder.stop();
      else resolve();
    });

    try {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
      cleanupStream();

      const formData = new FormData();
      formData.append('audio', blob, 'voice.webm');

      const res = await fetch('/api/agent/transcribe', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Transcription failed');

      const spoken = typeof data.text === 'string' ? data.text.trim() : '';
      if (spoken) emitTranscript(spoken);
      else setError('Could not understand audio. Please try again.');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Transcription failed';
      setError(msg);
    } finally {
      setIsProcessing(false);
      stopTimer();
      activeRef.current = false;
      setMode(null);
    }
  }, [cleanupStream, emitTranscript, stopTimer]);

  const start = useCallback(
    (prefix: string) => {
      if (activeRef.current) {
        fullStop();
        return;
      }

      const hasWebSpeech = !!getSpeechRecognition();
      const hasRecorder = typeof MediaRecorder !== 'undefined';

      if (!hasWebSpeech && !hasRecorder) {
        setError('Voice input is not supported in this browser. Use Chrome or Edge.');
        return;
      }

      baseTextRef.current = prefix;
      prefixRef.current = prefix;
      finalsRef.current = '';
      intentionalStopRef.current = false;
      activeRef.current = true;
      setError(null);
      startTimer();

      if (hasWebSpeech) {
        setMode('webspeech');
        setIsListening(true);
        attachWebSpeech();
      } else {
        void startWhisperCapture();
      }
    },
    [attachWebSpeech, fullStop, startTimer, startWhisperCapture]
  );

  const stop = useCallback(() => {
    fullStop();
  }, [fullStop]);

  const cancel = useCallback(() => {
    onTranscriptRef.current('', baseTextRef.current);
    fullStop();
  }, [fullStop]);

  const confirm = useCallback(() => {
    intentionalStopRef.current = true;
    activeRef.current = false;

    if (mode === 'whisper') {
      void transcribeRecording();
      return;
    }

    recognitionRef.current?.stop();
    recognitionRef.current = null;
    stopTimer();
    setIsListening(false);
    setMode(null);
  }, [mode, stopTimer, transcribeRecording]);

  useEffect(() => {
    const hasWebSpeech = !!getSpeechRecognition();
    const hasRecorder = typeof MediaRecorder !== 'undefined';
    setIsSupported(hasWebSpeech || hasRecorder);
    return () => fullStop();
  }, [fullStop]);

  return {
    isListening,
    isSupported,
    isProcessing,
    audioLevel,
    elapsedSec,
    error,
    mode,
    start,
    stop,
    cancel,
    confirm,
  };
}
