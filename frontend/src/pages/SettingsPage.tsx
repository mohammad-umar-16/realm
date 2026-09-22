import { useState } from "react";
import { useAuthStore } from "../store/authStore";
import { apiFetch } from "../lib/api";

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
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="mb-6 font-display text-2xl text-ink">Settings</h1>
      <div className="space-y-4 rounded-xl bg-surface p-6">
        <div>
          <p className="text-sm text-ink-muted">Name</p>
          <p className="text-ink">{user?.displayName}</p>
        </div>
        <div>
          <p className="text-sm text-ink-muted">Email</p>
          <p className="text-ink">{user?.email}</p>
        </div>
        <div>
          <p className="mb-1 text-sm text-ink-muted">Preferred language</p>
          <p className="mb-2 text-xs text-ink-muted">
            Used for direct messages — your messages send in this language, and incoming messages translate into it.
          </p>
          <div className="flex gap-2">
            <select
              className="flex-1 rounded-md bg-surface-2 p-2 text-ink outline-none"
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
              className="rounded-md bg-primary px-4 text-sm font-medium text-ink hover:bg-primary-hover"
            >
              {saved ? "Saved" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}