import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Video, Users, History as HistoryIcon } from "lucide-react";
import { apiFetch } from "../lib/api";
import { Skeleton } from "../components/ui/Skeleton";

interface Contact {
  id: string;
  displayName: string;
  email: string;
}

export function DashboardPage() {
  const [joinCode, setJoinCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Contact[] | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    apiFetch<{ contacts: Contact[] }>("/api/contacts")
      .then((res) => setContacts(res.contacts))
      .catch(() => setContacts([]));
  }, []);

  const handleStartCall = async () => {
    setCreating(true);
    setError(null);
    try {
      const { roomCode } = await apiFetch<{ roomCode: string }>("/api/rooms", { method: "POST" });
      navigate(`/call?room=${roomCode}`);
    } catch {
      setError("Couldn't create a room — try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleJoinByCode = () => {
    if (!joinCode.trim()) return;
    navigate(`/call?room=${joinCode.trim().toUpperCase()}`);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6 lg:p-8">
      <h1 className="font-display text-2xl text-ink">Dashboard</h1>

      <div className="rounded-xl bg-surface p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/25">
            <Video className="h-5 w-5 text-primary-light" strokeWidth={1.75} />
          </div>
          <div>
            <h2 className="text-lg font-medium text-ink">Start a call</h2>
            <p className="text-sm text-ink-muted">Video call with live translation</p>
          </div>
        </div>

        {error && <p className="mb-3 rounded-md bg-red-900/50 p-2 text-sm text-red-300">{error}</p>}

        <button
          onClick={handleStartCall}
          disabled={creating}
          className="mb-4 w-full rounded-md bg-primary p-2.5 font-medium text-ink transition-colors hover:bg-primary-hover disabled:opacity-40"
        >
          {creating ? "Creating…" : "Start a new call"}
        </button>

        <div className="flex gap-2">
          <input
            className="flex-1 rounded-md bg-surface-2 p-2 text-ink outline-none transition-colors placeholder:text-ink-muted focus:ring-1 focus:ring-primary-light"
            placeholder="Enter a room code to join"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleJoinByCode()}
          />
          <button
            onClick={handleJoinByCode}
            className="rounded-md bg-surface-2 px-4 font-medium text-ink transition-colors hover:bg-border"
          >
            Join
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link to="/contacts" className="rounded-xl bg-surface p-5 transition-colors hover:bg-surface-2/60">
          <div className="mb-2 flex items-center gap-2 text-ink-muted">
            <Users className="h-4 w-4" strokeWidth={1.75} />
            <span className="text-sm">Contacts</span>
          </div>
          {contacts === null ? (
            <Skeleton className="h-5 w-24" />
          ) : contacts.length === 0 ? (
            <p className="text-sm text-ink-muted">No contacts yet</p>
          ) : (
            <p className="text-ink">
              {contacts.length} contact{contacts.length === 1 ? "" : "s"}
            </p>
          )}
        </Link>

        <Link to="/history" className="rounded-xl bg-surface p-5 transition-colors hover:bg-surface-2/60">
          <div className="mb-2 flex items-center gap-2 text-ink-muted">
            <HistoryIcon className="h-4 w-4" strokeWidth={1.75} />
            <span className="text-sm">Recent calls</span>
          </div>
          <p className="text-sm text-ink-muted">View your call history</p>
        </Link>
      </div>
    </div>
  );
}