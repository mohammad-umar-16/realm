import { useEffect, useRef, useState } from "react";
import { X, Send } from "lucide-react";
import { useChatStore } from "../../store/chatStore";
import { MessageBubble } from "./MessageBubble";

interface Props {
  open: boolean;
  onClose: () => void;
  onSend: (text: string) => void;
}

export function ChatPanel({ open, onClose, onSend }: Props) {
  const [draft, setDraft] = useState("");
  const messages = useChatStore((s) => s.messages);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft("");
  };

  return (
    <div
      className={`absolute right-0 top-0 flex h-full w-80 flex-col border-l border-border bg-surface transition-transform duration-200 ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="flex items-center justify-between border-b border-border p-3">
        <span className="font-display text-ink">Chat</span>
        <button onClick={onClose} aria-label="Close chat" className="text-ink-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-light">
          <X className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>

      <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto p-3">
        {messages.map((m) => (
          <MessageBubble key={m.id} msg={m} />
        ))}
      </div>

      <div className="flex gap-2 border-t border-border p-3">
        <input
          className="flex-1 rounded-md bg-surface-2 p-2 text-sm text-ink outline-none transition-colors placeholder:text-ink-muted focus:ring-1 focus:ring-primary-light"
          placeholder="Type a message…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button
          onClick={handleSend}
          aria-label="Send message"
          className="flex items-center justify-center rounded-md bg-primary px-3 text-ink transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-light"
        >
          <Send className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}