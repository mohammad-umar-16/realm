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
    <div className="absolute left-1/2 top-2 -translate-x-1/2 rounded-full bg-gold/90 px-3 py-1 text-sm text-bg">
      {LABELS[status] ?? status}
    </div>
  );
}