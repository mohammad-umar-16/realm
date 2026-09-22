import { useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch, ApiRequestError } from "../lib/api";

const FEATURES = [
  { title: "Live translated captions", detail: "Read what's said, in your own language, as they speak." },
  { title: "Real-time voice translation", detail: "Hear it spoken back to you, not just subtitled." },
  { title: "Message across languages", detail: "Chat and call your contacts — everything translates both ways." },
];

function BrandPanel() {
  return (
    <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-surface p-12 lg:flex">
      <div className="flex items-center gap-3">
        <img src="/logo-icon.png" alt="" className="h-9 w-9 rounded-lg" />
        <span className="font-display text-2xl text-ink">Realm</span>
      </div>

      <div className="max-w-md">
        <h1 className="mb-3 font-display text-4xl leading-tight text-ink">Talk beyond borders.</h1>
        <p className="mb-10 text-ink-muted">
          Video call anyone, in any language — Realm translates as you speak, live.
        </p>

        <div className="space-y-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="border-l-2 border-gold pl-4">
              <p className="font-medium text-ink">{f.title}</p>
              <p className="text-sm text-ink-muted">{f.detail}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-ink-muted">Real-time translation across 7 languages</p>
    </div>
  );
}

export function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({ email, password, displayName }),
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "signup failed");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen bg-bg">
        <BrandPanel />
        <div className="flex w-full items-center justify-center p-6 text-center lg:w-1/2">
          <div className="max-w-sm space-y-3">
            <h1 className="font-display text-xl text-ink">Check your email</h1>
            <p className="text-ink-muted">
              We sent a verification link to <span className="text-ink">{email}</span>. Click it to activate your
              account.
            </p>
            <Link to="/login" className="inline-block text-primary-light hover:underline">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-bg">
      <BrandPanel />

      <div className="flex w-full items-center justify-center p-6 lg:w-1/2">
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
          <div className="mb-2 flex items-center gap-2 lg:hidden">
            <img src="/logo-icon.png" alt="" className="h-7 w-7 rounded-md" />
            <span className="font-display text-xl text-ink">Realm</span>
          </div>

          <div>
            <h2 className="font-display text-2xl text-ink">Create your account</h2>
            <p className="text-sm text-ink-muted">Start talking across languages</p>
          </div>

          {error && <p className="rounded-md bg-red-900/50 p-2 text-sm text-red-300">{error}</p>}

          <input
            className="w-full rounded-md bg-surface-2 p-2 text-ink outline-none placeholder:text-ink-muted"
            placeholder="Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
          <input
            className="w-full rounded-md bg-surface-2 p-2 text-ink outline-none placeholder:text-ink-muted"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="w-full rounded-md bg-surface-2 p-2 text-ink outline-none placeholder:text-ink-muted"
            placeholder="Password (min 8 characters)"
            type="password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary p-2 font-medium text-ink hover:bg-primary-hover disabled:opacity-40"
          >
            {loading ? "Creating account…" : "Sign up"}
          </button>

          <p className="text-center text-sm text-ink-muted">
            Already have an account?{" "}
            <Link to="/login" className="text-primary-light hover:underline">
              Log in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}