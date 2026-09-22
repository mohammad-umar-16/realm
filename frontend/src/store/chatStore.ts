import { create } from "zustand";

export interface ChatEntry {
  id: string;
  fromSocketId: string;
  senderLabel: string;
  isOwn: boolean;
  originalText: string;
  translatedText: string;
  createdAt: string;
}

interface ChatState {
  messages: ChatEntry[];
  addMessage: (m: ChatEntry) => void;
  clear: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  addMessage: (m) => set((s) => ({ messages: [...s.messages, m] })),
  clear: () => set({ messages: [] }),
}));
