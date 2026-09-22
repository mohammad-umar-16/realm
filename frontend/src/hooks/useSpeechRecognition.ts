import { useEffect, useRef, useState } from "react";

// only Chrome/Edge (Blink) implement this reliably — Safari/Firefox fall back to Whisper
const SpeechRecognitionImpl: typeof window.SpeechRecognition | undefined =
  window.SpeechRecognition || (window as any).webkitSpeechRecognition;

export const isSpeechRecognitionSupported = !!SpeechRecognitionImpl;

interface Options {
  active: boolean;
  lang: string; // BCP-47, e.g. "en-US"
  onFinalResult: (text: string) => void;
}

export function useSpeechRecognition({ active, lang, onFinalResult }: Options) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const shouldRestartRef = useRef(false); // tracks intent to keep listening across auto-restarts

  useEffect(() => {
    if (!active || !SpeechRecognitionImpl) return;

    const recognition = new SpeechRecognitionImpl();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;
    recognitionRef.current = recognition;
    shouldRestartRef.current = true;

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const result = e.results[e.results.length - 1];
      if (result.isFinal) {
        const text = result[0].transcript.trim();
        if (text) onFinalResult(text);
      }
    };

    // browser recognition sessions auto-stop after silence — restart to keep it "continuous"
    // in practice; only errors that mean "stop trying" should not restart (permission denied)
    recognition.onend = () => {
      setListening(false);
      if (shouldRestartRef.current) recognition.start();
    };

    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      console.error("speech recognition error:", e.error);
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        shouldRestartRef.current = false; // mic permission issue — don't loop retrying
      }
      // "no-speech" / "aborted" / network blips are expected and handled by onend's restart
    };

    recognition.onstart = () => setListening(true);
    recognition.start();

    return () => {
      shouldRestartRef.current = false;
      recognition.stop();
      recognitionRef.current = null;
    };
  }, [active, lang]);

  return { listening };
}
