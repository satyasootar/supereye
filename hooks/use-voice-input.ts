'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type SpeechRecognitionCtor = new () => SpeechRecognition;

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export type VoiceInputState = {
  isListening: boolean;
  isSupported: boolean;
  audioLevel: number;
  interimText: string;
  start: (prefix: string) => void;
  stop: () => void;
};

export function useVoiceInput(
  onTranscript: (prefix: string, spoken: string) => void
): VoiceInputState {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [interimText, setInterimText] = useState('');

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const prefixRef = useRef('');
  const onTranscriptRef = useRef(onTranscript);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number>(0);
  const simulatedRef = useRef(0);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  const cleanupAudio = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    void audioCtxRef.current?.close();
    audioCtxRef.current = null;
    setAudioLevel(0);
  }, []);

  const startAudioMonitor = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.75;
      source.connect(analyser);

      const bins = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(bins);
        let sum = 0;
        for (let i = 0; i < bins.length; i++) sum += bins[i];
        const level = sum / bins.length / 255;
        setAudioLevel(level);
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      // Fallback: gentle simulated pulse when mic analysis unavailable
      const tick = () => {
        simulatedRef.current += 0.08;
        const level = 0.15 + Math.abs(Math.sin(simulatedRef.current)) * 0.35;
        setAudioLevel(level);
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    }
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    cleanupAudio();
    setIsListening(false);
    setInterimText('');
  }, [cleanupAudio]);

  const start = useCallback(
    (prefix: string) => {
      const Ctor = getSpeechRecognition();
      if (!Ctor) return;

      if (isListening) {
        stop();
        return;
      }

      prefixRef.current = prefix;
      setInterimText('');
      void startAudioMonitor();

      const recognition = new Ctor();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);

      recognition.onend = () => {
        setIsListening(false);
        setInterimText('');
        cleanupAudio();
        recognitionRef.current = null;
      };

      recognition.onerror = () => {
        setIsListening(false);
        setInterimText('');
        cleanupAudio();
        recognitionRef.current = null;
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        // Build full transcript from all results — replace, never append per event
        let spoken = '';
        for (let i = 0; i < event.results.length; i++) {
          spoken += event.results[i][0].transcript;
        }
        spoken = spoken.trim();
        if (!spoken) return;

        const isFinal = event.results[event.results.length - 1]?.isFinal;
        setInterimText(spoken);
        onTranscriptRef.current(prefixRef.current, spoken);

        if (isFinal) setInterimText('');
      };

      recognitionRef.current = recognition;
      recognition.start();
    },
    [cleanupAudio, isListening, startAudioMonitor, stop]
  );

  useEffect(() => {
    setIsSupported(!!getSpeechRecognition());
    return () => {
      recognitionRef.current?.abort();
      cleanupAudio();
    };
  }, [cleanupAudio]);

  return { isListening, isSupported, audioLevel, interimText, start, stop };
}
