import { useState } from "react";

const LANGS = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "zh", label: "Chinese" },
  { code: "ar", label: "Arabic" },
];

interface Props {
  onJoin: (data: { roomCode: string; displayName: string; preferredLang: string }) => void;
  defaultDisplayName?: string;
  defaultRoomCode?: string;
  onBack?: () => void;
}

export function JoinRoom({ onJoin, defaultDisplayName = "", defaultRoomCode = "", onBack }: Props) {
  const [roomCode, setRoomCode] = useState(defaultRoomCode);
  const [displayName, setDisplayName] = useState(defaultDisplayName);
  const [preferredLang, setPreferredLang] = useState("en");

  const canJoin = roomCode.trim().length > 0 && displayName.trim().length > 0;

  return (
    <div className="flex h-screen items-center justify-center bg-bg">
      <div className="w-full max-w-sm space-y-4 rounded-xl bg-surface p-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-xl text-ink">Join a call</h1>
          {onBack && (
            <button onClick={onBack} className="text-sm text-ink-muted hover:text-ink">
              ← Dashboard
            </button>
          )}
        </div>

        <input
          className="w-full rounded-md bg-surface-2 p-2 text-ink outline-none placeholder:text-ink-muted"
          placeholder="Your name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />

        <input
          className="w-full rounded-md bg-surface-2 p-2 text-ink outline-none placeholder:text-ink-muted"
          placeholder="Room code"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
        />

        <select
          className="w-full rounded-md bg-surface-2 p-2 text-ink outline-none"
          value={preferredLang}
          onChange={(e) => setPreferredLang(e.target.value)}
        >
          {LANGS.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>

        <button
          disabled={!canJoin}
          onClick={() => onJoin({ roomCode: roomCode.trim(), displayName: displayName.trim(), preferredLang })}
          className="w-full rounded-md bg-primary p-2 font-medium text-ink hover:bg-primary-hover disabled:opacity-40"
        >
          Join
        </button>
      </div>
    </div>
  );
}