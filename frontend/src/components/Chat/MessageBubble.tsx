import type { ChatEntry } from "../../store/chatStore";

export function MessageBubble({ msg }: { msg: ChatEntry }) {
  return (
    <div className={`flex flex-col ${msg.isOwn ? "items-end" : "items-start"}`}>
      <span className="text-xs text-ink-muted">{msg.isOwn ? "You" : msg.senderLabel}</span>
      <div
        className={`max-w-[80%] rounded-lg px-3 py-1.5 text-sm text-ink ${
          msg.isOwn ? "bg-primary" : "border border-gold/40 bg-surface-2"
        }`}
      >
        {msg.translatedText}
        {msg.translatedText !== msg.originalText && (
          <div className="mt-0.5 text-xs italic text-ink-muted">{msg.originalText}</div>
        )}
      </div>
    </div>
  );
}