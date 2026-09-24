import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus, MessageCircle, Phone, Check, X, Users } from "lucide-react";
import { apiFetch, ApiRequestError } from "../lib/api";
import { Avatar } from "../components/ui/Avatar";
import { EmptyState } from "../components/ui/EmptyState";
import { Skeleton } from "../components/ui/Skeleton";

interface Contact {
  id: string;
  displayName: string;
  email: string;
}

interface ContactRequest extends Contact {
  contactId: string;
}

export function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[] | null>(null);
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const loadAll = async () => {
    const [c, r] = await Promise.all([
      apiFetch<{ contacts: Contact[] }>("/api/contacts"),
      apiFetch<{ requests: ContactRequest[] }>("/api/contacts/requests"),
    ]);
    setContacts(c.contacts);
    setRequests(r.requests);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await apiFetch("/api/contacts", { method: "POST", body: JSON.stringify({ email }) });
      setSuccess(`Request sent to ${email}`);
      setEmail("");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "couldn't send request");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (contactId: string) => {
    await apiFetch(`/api/contacts/${contactId}/accept`, { method: "POST" });
    loadAll();
  };

  const handleDecline = async (contactId: string) => {
    await apiFetch(`/api/contacts/${contactId}/decline`, { method: "POST" });
    loadAll();
  };

  const handleCall = async (contact: Contact) => {
    const { roomCode } = await apiFetch<{ roomCode: string }>("/api/rooms", { method: "POST" });
    navigate(`/call?room=${roomCode}`);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6 lg:p-8">
      <h1 className="font-display text-2xl text-ink">Contacts</h1>

      <form onSubmit={handleAdd} className="rounded-xl bg-surface p-6">
        <div className="mb-3 flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-ink-muted" strokeWidth={1.75} />
          <h2 className="text-lg font-medium text-ink">Add a contact</h2>
        </div>
        {error && <p className="mb-3 rounded-md bg-red-900/50 p-2 text-sm text-red-300">{error}</p>}
        {success && <p className="mb-3 rounded-md bg-gold/10 p-2 text-sm text-gold-light">{success}</p>}
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-md bg-surface-2 p-2 text-ink outline-none transition-colors placeholder:text-ink-muted focus:ring-1 focus:ring-primary-light"
            placeholder="Their email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-primary px-4 font-medium text-ink transition-colors hover:bg-primary-hover disabled:opacity-40"
          >
            Send request
          </button>
        </div>
      </form>

      {requests.length > 0 && (
        <div className="rounded-xl bg-surface p-6">
          <h2 className="mb-3 text-lg font-medium text-ink">Pending requests</h2>
          <div className="space-y-2">
            {requests.map((r) => (
              <div key={r.contactId} className="flex items-center justify-between rounded-md bg-surface-2 p-3">
                <div className="flex items-center gap-3">
                  <Avatar name={r.displayName} />
                  <div>
                    <p className="text-ink">{r.displayName}</p>
                    <p className="text-xs text-ink-muted">{r.email}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAccept(r.contactId)}
                    title="Accept"
                    aria-label={`Accept request from ${r.displayName}`}
                    className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-ink transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-light"
                  >
                    <Check className="h-4 w-4" strokeWidth={2} />
                  </button>
                  <button
                    onClick={() => handleDecline(r.contactId)}
                    title="Decline"
                    aria-label={`Decline request from ${r.displayName}`}
                    className="flex h-10 w-10 items-center justify-center rounded-md bg-surface text-ink-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-light"
                  >
                    <X className="h-4 w-4" strokeWidth={2} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl bg-surface p-6">
        <h2 className="mb-3 text-lg font-medium text-ink">Your contacts</h2>
        {contacts === null ? (
          <div className="space-y-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : contacts.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No contacts yet"
            subtitle="Add someone by email above to start calling and messaging them."
          />
        ) : (
          <div className="space-y-2">
            {contacts.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-md bg-surface-2 p-3 transition-colors hover:bg-surface-2/80">
                <div className="flex items-center gap-3">
                  <Avatar name={c.displayName} />
                  <div>
                    <p className="text-ink">{c.displayName}</p>
                    <p className="text-xs text-ink-muted">{c.email}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`/messages/${c.id}`}
                    title="Message"
                    aria-label={`Message ${c.displayName}`}
                    className="flex h-10 w-10 items-center justify-center rounded-md border border-primary-light/40 text-primary-light transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-light"
                  >
                    <MessageCircle className="h-4 w-4" strokeWidth={1.75} />
                  </Link>
                  <button
                    onClick={() => handleCall(c)}
                    title="Call"
                    aria-label={`Call ${c.displayName}`}
                    className="flex h-10 w-10 items-center justify-center rounded-md border border-gold/40 text-gold-light transition-colors hover:bg-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                  >
                    <Phone className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}