import { useEffect, useRef } from "react";

const WHISPER_URL = import.meta.env.VITE_WHISPER_URL || "http://localhost:8000";
const CHUNK_MS = 4000; // shorter = lower latency but more overhead/less context per chunk

interface Options {
  active: boolean;
  stream: MediaStream | null;
  lang: string; // ISO 639-1, e.g. "en"
  onResult: (text: string) => void;
}

// records fixed-length audio chunks and sends each to the self-hosted Whisper service —
// not true streaming (Whisper isn't natively streaming), so there's an inherent ~chunk-length
// latency floor; acceptable trade for cross-browser support vs. Web Speech API's Chrome-only reach
export function useWhisperFallback({ active, stream, lang, onResult }: Options) {
  const recorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    if (!active || !stream) return;

    let stopped = false;
    let recorder: MediaRecorder;

    const recordChunk = () => {
      if (stopped) return;
      const chunks: BlobPart[] = [];
      recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => chunks.push(e.data);

      recorder.onstop = async () => {
        if (chunks.length && !stopped) {
          const blob = new Blob(chunks, { type: "audio/webm" });
          await sendChunk(blob, lang, onResult);
        }
        if (!stopped) recordChunk(); // chain the next chunk
      };

      recorder.start();
      setTimeout(() => recorder.state === "recording" && recorder.stop(), CHUNK_MS);
    };

    recordChunk();

    return () => {
      stopped = true;
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    };
  }, [active, stream, lang]);
}

async function sendChunk(blob: Blob, lang: string, onResult: (text: string) => void) {
  try {
    const form = new FormData();
    form.append("audio", blob, "chunk.webm");
    form.append("lang", lang);

    const resp = await fetch(`${WHISPER_URL}/transcribe`, { method: "POST", body: form });
    if (!resp.ok) return; // drop silently — next chunk will follow shortly, no need to surface every failed chunk

    const { text } = await resp.json();
    if (text?.trim()) onResult(text.trim());
  } catch (err) {
    console.error("whisper chunk failed:", err);
  }
}
