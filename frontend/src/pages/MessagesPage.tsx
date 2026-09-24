import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Send, ArrowLeft, MessagesSquare, Users } from "lucide-react";
import { apiFetch } from "../lib/api";
import { translateText } from "../hooks/useTranslation";
import { useAuthStore } from "../store/authStore";
import { useSocketContext } from "../context/SocketContext";
import { Avatar } from "../components/ui/Avatar";
import { EmptyState } from "../components/ui/EmptyState";
import { Skeleton } from "../components/ui/Skeleton";

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

interface LiveDmEvent {
  id: string;
  text: string;
  lang: string;
  createdAt: string;
  fromUserId: string;
  toUserId: string;
}

const CONVERSATIONS_POLL_MS = 15000;
const THREAD_POLL_MS = 10000;

export function MessagesPage() {
  const { contactId } = useParams<{ contactId?: string }>();
  const navigate = useNavigate();
  const authUser = useAuthStore((s) => s.user);
  const myLang = authUser?.preferredLang ?? "en";
  const socket = useSocketContext();

  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const contactIdRef = useRef(contactId);

  useEffect(() => {
    contactIdRef.current = contactId;
  }, [contactId]);

  const loadConversations = () => {
    apiFetch<{ conversations: Conversation[] }>("/api/dm/conversations")
      .then((res) => setConversations(res.conversations))
      .catch(() => setConversations([]));
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
    if (!socket) return;

    const onDmMessage = (payload: LiveDmEvent) => {
      loadConversations();
      const openContactId = contactIdRef.current;
      const otherParty = payload.fromUserId === authUser?.id ? payload.toUserId : payload.fromUserId;
      if (openContactId && otherParty === openContactId) loadThread();
    };

    socket.on("dm-message", onDmMessage);
    return () => {
      socket.off("dm-message", onDmMessage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, authUser?.id, myLang]);

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

  const activeContact = conversations?.find((c) => c.contactId === contactId);

  return (
    <div className="flex h-full">
      <aside
        className={`w-full flex-shrink-0 overflow-y-auto border-r border-border bg-surface lg:block lg:w-72 ${
          contactId ? "hidden" : "block"
        }`}
      >
        <h1 className="p-4 font-display text-lg text-ink">Messages</h1>
        {conversations === null ? (
          <div className="space-y-1 p-3">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={MessagesSquare}
              title="No conversations yet"
              subtitle="Add a contact to start messaging."
              action={
                <Link to="/contacts" className="text-sm text-primary-light hover:underline">
                  Go to Contacts
                </Link>
              }
            />
          </div>
        ) : (
          conversations.map((c) => (
            <button
              key={c.contactId}
              onClick={() => navigate(`/messages/${c.contactId}`)}
              className={`flex w-full items-center gap-3 border-b border-border p-3 text-left transition-colors hover:bg-surface-2 ${
                c.contactId === contactId ? "bg-surface-2" : ""
              }`}
            >
              <Avatar name={c.displayName} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="truncate text-ink">{c.displayName}</p>
                  {c.unreadCount > 0 && (
                    <span className="ml-2 flex-shrink-0 rounded-full bg-gold px-2 py-0.5 text-xs text-bg">
                      {c.unreadCount}
                    </span>
                  )}
                </div>
                {c.lastMessage && (
                  <p className="truncate text-xs text-ink-muted">
                    {c.lastMessage.isOwn ? "You: " : ""}
                    {c.lastMessage.text}
                  </p>
                )}
              </div>
            </button>
          ))
        )}
      </aside>

      <main className={`flex flex-1 flex-col ${contactId ? "flex" : "hidden lg:flex"}`}>
        {!contactId ? (
          <EmptyState icon={Users} title="Select a conversation" />
        ) : (
          <>
            <div className="flex items-center gap-2 border-b border-border p-4">
              <button onClick={() => navigate("/messages")} aria-label="Back to conversations" className="text-ink-muted lg:hidden">
                <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
              </button>
              <Avatar name={activeContact?.displayName ?? "?"} size="sm" />
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
                className="flex-1 rounded-md bg-surface-2 p-2 text-ink outline-none transition-colors placeholder:text-ink-muted focus:ring-1 focus:ring-primary-light"
                placeholder="Type a message…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <button
                onClick={handleSend}
                aria-label="Send message"
                className="flex items-center justify-center rounded-md bg-primary px-4 text-ink transition-colors hover:bg-primary-hover"
              >
                <Send className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}