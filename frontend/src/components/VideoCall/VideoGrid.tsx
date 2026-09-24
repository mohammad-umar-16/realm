import { useEffect, useRef } from "react";
import { useCallStore } from "../../store/callStore";
import { useAudioLevel } from "../../hooks/useAudioLevel";

function VideoTile({
  stream,
  muted,
  label,
  mine,
}: {
  stream: MediaStream;
  muted?: boolean;
  label: string;
  mine: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const speaking = useAudioLevel(stream);

  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);

  const borderColor = mine ? "border-primary" : "border-gold";
  const ringClass = speaking ? (mine ? "ring-4 ring-primary/50" : "ring-4 ring-gold/50") : "";

  return (
    <div className={`relative overflow-hidden rounded-lg border-2 bg-surface transition-all ${borderColor} ${ringClass}`}>
      <video ref={ref} autoPlay playsInline muted={muted} className="h-full w-full object-cover" />
      <span className="absolute bottom-2 left-2 rounded bg-bg/70 px-2 py-0.5 text-xs text-ink">{label}</span>
    </div>
  );
}

function gridColumns(count: number) {
  if (count <= 1) return 1;
  if (count === 2) return 2;
  if (count <= 4) return 2;
  if (count <= 6) return 3;
  return 4;
}

export function VideoGrid() {
  const localStream = useCallStore((s) => s.localStream);
  const remoteStreams = useCallStore((s) => s.remoteStreams);
  const peers = useCallStore((s) => s.peers);

  const remoteEntries = Array.from(remoteStreams.entries());
  const tileCount = remoteEntries.length + 1;
  const columns = gridColumns(tileCount);

  return (
    <div className="grid h-full gap-2 bg-bg p-2" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {localStream && <VideoTile stream={localStream} muted label="You" mine />}
      {remoteEntries.map(([socketId, stream]) => (
        <VideoTile key={socketId} stream={stream} label={peers.get(socketId)?.displayName ?? "Guest"} mine={false} />
      ))}
    </div>
  );
}