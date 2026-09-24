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

const MIN_TILE_WIDTH_PX = 220;

export function VideoGrid() {
  const localStream = useCallStore((s) => s.localStream);
  const remoteStreams = useCallStore((s) => s.remoteStreams);
  const peers = useCallStore((s) => s.peers);

  const remoteEntries = Array.from(remoteStreams.entries());

  return (
    <div
      className="grid h-full gap-2 bg-bg p-2"
      style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${MIN_TILE_WIDTH_PX}px, 1fr))` }}
    >
      {localStream && <VideoTile stream={localStream} muted label="You" mine />}
      {remoteEntries.map(([socketId, stream]) => (
        <VideoTile
          key={socketId}
          stream={stream}
          label={peers.get(socketId)?.displayName ?? "Guest"}
          mine={false}
        />
      ))}
    </div>
  );
}