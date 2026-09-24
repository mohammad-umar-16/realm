import { useState } from "react";
import { Globe } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { apiFetch } from "../lib/api";
import { Avatar } from "../components/ui/Avatar";

const LANGS = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "zh", label: "Chinese" },
  { code: "ar", label: "Arabic" },
];

export function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [lang, setLang] = useState(user?.preferredLang ?? "en");
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    const res = await apiFetch<{ user: typeof user }>("/api/auth/me", {
      method: "PATCH",
      body: JSON.stringify({ preferredLang: lang }),
    });
    if (res.user) setUser(res.user);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="mx-auto max-w-2xl p-6 lg:p-8">
      <h1 className="mb-6 font-display text-2xl text-ink">Settings</h1>

      <div className="mb-4 flex items-center gap-3 rounded-xl bg-surface p-6">
        <Avatar name={user?.displayName ?? "?"} size="lg" />
        <div>
          <p className="text-ink">{user?.displayName}</p>
          <p className="text-sm text-ink-muted">{user?.email}</p>
        </div>
      </div>

      <div className="rounded-xl bg-surface p-6">
        <div className="mb-1 flex items-center gap-2">
          <Globe className="h-4 w-4 text-ink-muted" strokeWidth={1.75} />
          <p className="text-sm text-ink-muted">Preferred language</p>
        </div>
        <p className="mb-3 text-xs text-ink-muted">
          Used for direct messages — your messages send in this language, and incoming messages translate into it.
        </p>
        <div className="flex gap-2">
          <select
            className="flex-1 rounded-md bg-surface-2 p-2 text-ink outline-none transition-colors focus:ring-1 focus:ring-primary-light"
            value={lang}
            onChange={(e) => setLang(e.target.value)}
          >
            {LANGS.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
          <button
            onClick={handleSave}
            className="rounded-md bg-primary px-4 text-sm font-medium text-ink transition-colors hover:bg-primary-hover"
          >
            {saved ? "Saved" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}