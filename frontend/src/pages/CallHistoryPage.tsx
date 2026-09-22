import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

interface HistoryEntry {
  roomCode: string;
  joinedAt: string;
  durationSeconds: number | null;
  withParticipants: string[];
}

function formatDuration(seconds: number | null) {
  if (seconds === null) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function CallHistoryPage() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ history: HistoryEntry[] }>("/api/history")
      .then((res) => setHistory(res.history))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="mb-6 font-display text-2xl text-ink">Call History</h1>

      {loading ? (
        <p className="text-sm text-ink-muted">Loading…</p>
      ) : history.length === 0 ? (
        <div className="rounded-xl bg-surface p-6 text-center text-ink-muted">
          Your past calls will show up here once you've had a few.
        </div>
      ) : (
        <div className="space-y-2">
          {history.map((h, i) => (
            <div key={i} className="flex items-center justify-between rounded-md bg-surface p-4">
              <div>
                <p className="text-ink">
                  {h.withParticipants.length > 0 ? `With ${h.withParticipants.join(", ")}` : "Solo call"}
                </p>
                <p className="text-xs text-ink-muted">
                  {new Date(h.joinedAt).toLocaleString()} · Room {h.roomCode}
                </p>
              </div>
              <span className="text-sm text-gold-light">{formatDuration(h.durationSeconds)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}