import { Loader2 } from "lucide-react";
import { useCallStore } from "../../store/callStore";

const LABELS: Record<string, string> = {
  connecting: "Connecting…",
  reconnecting: "Reconnecting…",
  failed: "Connection failed",
};

export function ConnectionStatus() {
  const status = useCallStore((s) => s.status);
  if (status === "connected" || status === "idle") return null;

  return (
    <div className="absolute left-1/2 top-2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-gold/90 px-3 py-1 text-sm text-bg">
      {status !== "failed" && <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />}
      {LABELS[status] ?? status}
    </div>
  );
}