import { create } from "zustand";

interface CaptionEntry {
  speakerLabel: string;
  originalText: string;
  translatedText: string;
  updatedAt: number;
}

interface CaptionState {
  captions: Map<string, CaptionEntry>; // socketId -> latest caption
  setCaption: (socketId: string, entry: CaptionEntry) => void;
  clearCaption: (socketId: string) => void;
}

export const useCaptionStore = create<CaptionState>((set) => ({
  captions: new Map(),

  setCaption: (socketId, entry) =>
    set((s) => {
      const next = new Map(s.captions);
      next.set(socketId, entry);
      return { captions: next };
    }),

  clearCaption: (socketId) =>
    set((s) => {
      const next = new Map(s.captions);
      next.delete(socketId);
      return { captions: next };
    }),
}));
