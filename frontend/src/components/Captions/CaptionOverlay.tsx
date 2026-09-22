import { useEffect } from "react";
import { useCaptionStore } from "../../store/captionStore";

const CAPTION_TTL_MS = 6000;

export function CaptionOverlay() {
  const captions = useCaptionStore((s) => s.captions);
  const clearCaption = useCaptionStore((s) => s.clearCaption);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      captions.forEach((entry, socketId) => {
        if (now - entry.updatedAt > CAPTION_TTL_MS) clearCaption(socketId);
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [captions, clearCaption]);

  const entries = Array.from(captions.values());
  if (entries.length === 0) return null;

  return (
    <div className="pointer-events-none absolute bottom-20 left-1/2 w-full max-w-2xl -translate-x-1/2 space-y-1 px-4">
      {entries.map((c, i) => (
        <div key={i} className="rounded-md border-l-2 border-gold bg-bg/80 px-3 py-1.5 text-center text-sm text-ink">
          <span className="mr-2 font-medium text-gold-light">{c.speakerLabel}:</span>
          {c.translatedText}
        </div>
      ))}
    </div>
  );
}