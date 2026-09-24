import { useEffect, useRef, useState } from "react";

export function useAudioLevel(stream: MediaStream | null) {
  const [speaking, setSpeaking] = useState(false);
  const rafRef = useRef<number>();

  useEffect(() => {
    if (!stream || stream.getAudioTracks().length === 0) return;

    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);

    const data = new Uint8Array(analyser.frequencyBinCount);
    const SPEAKING_THRESHOLD = 20;

    const tick = () => {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((sum, v) => sum + v, 0) / data.length;
      setSpeaking(avg > SPEAKING_THRESHOLD);
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      source.disconnect();
      audioContext.close().catch(() => {});
    };
  }, [stream]);

  return speaking;
}