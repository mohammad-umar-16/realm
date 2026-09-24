import { useState } from "react";
import { BrandPanel } from "../Layout/BrandPanel";

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
    <div className="flex min-h-screen bg-bg">
      <BrandPanel />

      <div className="flex w-full items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-sm space-y-4">
          <div className="mb-2 flex items-center gap-2 lg:hidden">
            <img src="/logo-icon.png" alt="" className="h-7 w-7 rounded-md" />
            <span className="font-display text-xl text-ink">Realm</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl text-ink">Join a call</h2>
              <p className="text-sm text-ink-muted">Enter a room code to get started</p>
            </div>
            {onBack && (
              <button
                onClick={onBack}
                className="rounded-md px-2 py-1 text-sm text-ink-muted transition-colors hover:text-ink"
              >
                ← Dashboard
              </button>
            )}
          </div>

          <input
            className="w-full rounded-md bg-surface-2 p-2 text-ink outline-none transition-colors placeholder:text-ink-muted focus:ring-1 focus:ring-primary-light"
            placeholder="Your name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />

          <input
            className="w-full rounded-md bg-surface-2 p-2 text-ink outline-none transition-colors placeholder:text-ink-muted focus:ring-1 focus:ring-primary-light"
            placeholder="Room code"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
          />

          <select
            className="w-full rounded-md bg-surface-2 p-2 text-ink outline-none transition-colors focus:ring-1 focus:ring-primary-light"
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
            className="w-full rounded-md bg-primary p-2 font-medium text-ink transition-colors hover:bg-primary-hover disabled:opacity-40"
          >
            Join
          </button>
        </div>
      </div>
    </div>
  );
}