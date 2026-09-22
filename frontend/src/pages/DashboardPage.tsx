import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiFetch } from "../lib/api";

interface Contact {
  id: string;
  displayName: string;
  email: string;
}

export function DashboardPage() {
  const [joinCode, setJoinCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    apiFetch<{ contacts: Contact[] }>("/api/contacts")
      .then((res) => setContacts(res.contacts))
      .catch(() => {});
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
    <div className="mx-auto max-w-2xl space-y-8 p-8">
      <h1 className="font-display text-2xl text-ink">Dashboard</h1>

      <div className="rounded-xl bg-surface p-6">
        <h2 className="mb-3 text-lg font-medium text-ink">Start a call</h2>
        {error && <p className="mb-3 rounded-md bg-red-900/50 p-2 text-sm text-red-300">{error}</p>}

        <button
          onClick={handleStartCall}
          disabled={creating}
          className="mb-4 w-full rounded-md bg-primary p-2 font-medium text-ink hover:bg-primary-hover disabled:opacity-40"
        >
          {creating ? "Creating…" : "Start a new call"}
        </button>

        <div className="flex gap-2">
          <input
            className="flex-1 rounded-md bg-surface-2 p-2 text-ink outline-none placeholder:text-ink-muted"
            placeholder="Enter a room code to join"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleJoinByCode()}
          />
          <button onClick={handleJoinByCode} className="rounded-md bg-surface-2 px-4 font-medium text-ink hover:bg-border">
            Join
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-surface p-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-medium text-ink">Contacts</h2>
          <Link to="/contacts" className="text-sm text-primary-light hover:underline">
            View all
          </Link>
        </div>
        {contacts.length === 0 ? (
          <p className="text-sm text-ink-muted">No contacts yet.</p>
        ) : (
          <p className="text-sm text-ink-muted">
            {contacts.length} contact{contacts.length === 1 ? "" : "s"} — {contacts.slice(0, 3).map((c) => c.displayName).join(", ")}
            {contacts.length > 3 ? "…" : ""}
          </p>
        )}
      </div>

      <div className="rounded-xl bg-surface p-6">
        <h2 className="mb-2 text-lg font-medium text-ink">Recent calls</h2>
        <p className="text-sm text-ink-muted">No calls yet — start one above.</p>
      </div>
    </div>
  );
}