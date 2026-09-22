import { useEffect, useRef, useState } from "react";
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

  if (!open) return null;

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft("");
  };

  return (
    <div className="absolute right-0 top-0 flex h-full w-80 flex-col border-l border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border p-3">
        <span className="font-display text-ink">Chat</span>
        <button onClick={onClose} className="text-ink-muted hover:text-ink">
          ✕
        </button>
      </div>

      <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto p-3">
        {messages.map((m) => (
          <MessageBubble key={m.id} msg={m} />
        ))}
      </div>

      <div className="flex gap-2 border-t border-border p-3">
        <input
          className="flex-1 rounded-md bg-surface-2 p-2 text-sm text-ink outline-none placeholder:text-ink-muted"
          placeholder="Type a message…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button onClick={handleSend} className="rounded-md bg-primary px-3 text-sm text-ink hover:bg-primary-hover">
          Send
        </button>
      </div>
    </div>
  );
}