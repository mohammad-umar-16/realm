import { useEffect, useState } from "react";
import { History } from "lucide-react";
import { apiFetch } from "../lib/api";
import { Avatar } from "../components/ui/Avatar";
import { EmptyState } from "../components/ui/EmptyState";
import { Skeleton } from "../components/ui/Skeleton";

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
  const [history, setHistory] = useState<HistoryEntry[] | null>(null);

  useEffect(() => {
    apiFetch<{ history: HistoryEntry[] }>("/api/history")
      .then((res) => setHistory(res.history))
      .catch(() => setHistory([]));
  }, []);

  return (
    <div className="mx-auto max-w-2xl p-6 lg:p-8">
      <h1 className="mb-6 font-display text-2xl text-ink">Call History</h1>

      {history === null ? (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : history.length === 0 ? (
        <EmptyState icon={History} title="No calls yet" subtitle="Your past calls will show up here once you've had a few." />
      ) : (
        <div className="space-y-2">
          {history.map((h, i) => (
            <div key={i} className="flex items-center gap-3 rounded-md bg-surface p-4 transition-colors hover:bg-surface-2/40">
              <Avatar name={h.withParticipants[0] ?? "?"} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-ink">
                  {h.withParticipants.length > 0 ? `With ${h.withParticipants.join(", ")}` : "Solo call"}
                </p>
                <p className="text-xs text-ink-muted">
                  {new Date(h.joinedAt).toLocaleString()} · Room {h.roomCode}
                </p>
              </div>
              <span className="flex-shrink-0 text-sm text-gold-light">{formatDuration(h.durationSeconds)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}