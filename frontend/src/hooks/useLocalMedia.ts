import { useEffect, useState } from "react";
import { useCallStore } from "../store/callStore";

type MediaError = "permission-denied" | "no-device" | "unknown" | null;

export function useLocalMedia(active: boolean) {
  const [error, setError] = useState<MediaError>(null);
  const setLocalStream = useCallStore((s) => s.setLocalStream);

  useEffect(() => {
    if (!active) return;
    let stream: MediaStream | null = null;

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((s) => {
        stream = s;
        setLocalStream(s);
        setError(null);
      })
      .catch((err: DOMException) => {
        // graceful degradation — surface a specific, actionable error rather than crashing
        if (err.name === "NotAllowedError") setError("permission-denied");
        else if (err.name === "NotFoundError") setError("no-device");
        else setError("unknown");
        console.error("getUserMedia failed:", err);
      });

    return () => {
      stream?.getTracks().forEach((t) => t.stop());
      setLocalStream(null);
    };
  }, [active]);

  return { error };
}
