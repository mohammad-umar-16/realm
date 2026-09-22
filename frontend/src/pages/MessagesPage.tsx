import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { translateText } from "../hooks/useTranslation";
import { useAuthStore } from "../store/authStore";

interface Conversation {
  contactId: string;
  displayName: string;
  email: string;
  lastMessage: { text: string; createdAt: string; isOwn: boolean } | null;
  unreadCount: number;
}

interface RawMessage {
  id: string;
  text: string;
  lang: string;
  isOwn: boolean;
  createdAt: string;
}

interface DisplayMessage extends RawMessage {
  translatedText: string;
}

const CONVERSATIONS_POLL_MS = 5000;
const THREAD_POLL_MS = 3000;

export function MessagesPage() {
  const { contactId } = useParams<{ contactId?: string }>();
  const navigate = useNavigate();
  const myLang = useAuthStore((s) => s.user?.preferredLang ?? "en");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const loadConversations = () => {
    apiFetch<{ conversations: Conversation[] }>("/api/dm/conversations")
      .then((res) => setConversations(res.conversations))
      .catch(() => {});
  };

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, CONVERSATIONS_POLL_MS);
    return () => clearInterval(interval);
  }, []);

  const loadThread = async () => {
    if (!contactId) return;
    const res = await apiFetch<{ messages: RawMessage[] }>(`/api/dm/${contactId}/messages`);
    const translated = await Promise.all(
      res.messages.map(async (m) => ({
        ...m,
        translatedText: m.isOwn ? m.text : await translateText(m.text, myLang),
      }))
    );
    setMessages(translated);
  };

  useEffect(() => {
    loadThread();
    const interval = setInterval(loadThread, THREAD_POLL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactId, myLang]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !contactId) return;
    setDraft("");
    await apiFetch(`/api/dm/${contactId}/messages`, { method: "POST", body: JSON.stringify({ text }) });
    loadThread();
    loadConversations();
  };

  const activeContact = conversations.find((c) => c.contactId === contactId);

  return (
    <div className="flex h-full">
      <aside className="w-72 flex-shrink-0 overflow-y-auto border-r border-border bg-surface">
        <h1 className="p-4 font-display text-lg text-ink">Messages</h1>
        {conversations.length === 0 ? (
          <p className="p-4 text-sm text-ink-muted">
            No conversations yet.{" "}
            <Link to="/contacts" className="text-primary-light hover:underline">
              Add a contact
            </Link>{" "}
            to start one.
          </p>
        ) : (
          conversations.map((c) => (
            <button
              key={c.contactId}
              onClick={() => navigate(`/messages/${c.contactId}`)}
              className={`block w-full border-b border-border p-3 text-left hover:bg-surface-2 ${
                c.contactId === contactId ? "bg-surface-2" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-ink">{c.displayName}</p>
                {c.unreadCount > 0 && (
                  <span className="rounded-full bg-gold px-2 py-0.5 text-xs text-bg">{c.unreadCount}</span>
                )}
              </div>
              {c.lastMessage && (
                <p className="truncate text-xs text-ink-muted">
                  {c.lastMessage.isOwn ? "You: " : ""}
                  {c.lastMessage.text}
                </p>
              )}
            </button>
          ))
        )}
      </aside>

      <main className="flex flex-1 flex-col">
        {!contactId ? (
          <div className="flex flex-1 items-center justify-center text-ink-muted">
            Select a conversation
          </div>
        ) : (
          <>
            <div className="border-b border-border p-4">
              <p className="font-display text-ink">{activeContact?.displayName ?? "…"}</p>
            </div>

            <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto p-4">
              {messages.map((m) => (
                <div key={m.id} className={`flex flex-col ${m.isOwn ? "items-end" : "items-start"}`}>
                  <div
                    className={`max-w-md rounded-lg px-3 py-1.5 text-sm text-ink ${
                      m.isOwn ? "bg-primary" : "border border-gold/40 bg-surface-2"
                    }`}
                  >
                    {m.translatedText}
                    {m.translatedText !== m.text && (
                      <div className="mt-0.5 text-xs italic text-ink-muted">{m.text}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 border-t border-border p-4">
              <input
                className="flex-1 rounded-md bg-surface-2 p-2 text-ink outline-none placeholder:text-ink-muted"
                placeholder="Type a message…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <button onClick={handleSend} className="rounded-md bg-primary px-4 text-ink hover:bg-primary-hover">
                Send
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}