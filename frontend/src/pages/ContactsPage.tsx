import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch, ApiRequestError } from "../lib/api";

interface Contact {
  id: string;
  displayName: string;
  email: string;
}

interface ContactRequest extends Contact {
  contactId: string;
}

export function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
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
    <div className="mx-auto max-w-2xl space-y-8 p-8">
      <h1 className="font-display text-2xl text-ink">Contacts</h1>

      <form onSubmit={handleAdd} className="rounded-xl bg-surface p-6">
        <h2 className="mb-3 text-lg font-medium text-ink">Add a contact</h2>
        {error && <p className="mb-3 rounded-md bg-red-900/50 p-2 text-sm text-red-300">{error}</p>}
        {success && <p className="mb-3 rounded-md bg-gold/10 p-2 text-sm text-gold-light">{success}</p>}
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-md bg-surface-2 p-2 text-ink outline-none placeholder:text-ink-muted"
            placeholder="Their email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-primary px-4 font-medium text-ink hover:bg-primary-hover disabled:opacity-40"
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
                <div>
                  <p className="text-ink">{r.displayName}</p>
                  <p className="text-xs text-ink-muted">{r.email}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAccept(r.contactId)}
                    className="rounded-md bg-primary px-3 py-1 text-sm text-ink hover:bg-primary-hover"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleDecline(r.contactId)}
                    className="rounded-md bg-surface px-3 py-1 text-sm text-ink-muted hover:text-ink"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl bg-surface p-6">
        <h2 className="mb-3 text-lg font-medium text-ink">Your contacts</h2>
        {contacts.length === 0 ? (
          <p className="text-sm text-ink-muted">No contacts yet — add someone by email above.</p>
        ) : (
          <div className="space-y-2">
            {contacts.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-md bg-surface-2 p-3">
                <div>
                  <p className="text-ink">{c.displayName}</p>
                  <p className="text-xs text-ink-muted">{c.email}</p>
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`/messages/${c.id}`}
                    className="rounded-md border border-primary-light/40 px-3 py-1 text-sm text-primary-light hover:bg-primary/10"
                  >
                    Message
                  </Link>
                  <button
                    onClick={() => handleCall(c)}
                    className="rounded-md border border-gold/40 px-3 py-1 text-sm text-gold-light hover:bg-gold/10"
                  >
                    Call
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