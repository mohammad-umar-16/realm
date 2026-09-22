import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch, ApiRequestError } from "../lib/api";
import { useAuthStore, type AuthUser } from "../store/authStore";

const FEATURES = [
  { title: "Live translated captions", detail: "Read what's said, in your own language, as they speak." },
  { title: "Real-time voice translation", detail: "Hear it spoken back to you, not just subtitled." },
  { title: "Message across languages", detail: "Chat and call your contacts — everything translates both ways." },
];

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [unverified, setUnverified] = useState(false);
  const [resent, setResent] = useState(false);
  const [loading, setLoading] = useState(false);

  const setUser = useAuthStore((s) => s.setUser);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setUnverified(false);
    setLoading(true);
    try {
      const res = await apiFetch<{ user: AuthUser }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setUser(res.user);
      navigate("/");
    } catch (err) {
      if (err instanceof ApiRequestError && err.code === "EMAIL_NOT_VERIFIED") {
        setUnverified(true);
      } else {
        setError(err instanceof ApiRequestError ? err.message : "login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    await apiFetch("/api/auth/resend-verification", { method: "POST", body: JSON.stringify({ email }) }).catch(
      () => {}
    );
    setResent(true);
  };

  return (
    <div className="flex min-h-screen bg-bg">
      {/* branding / value-prop panel — hidden on small screens, form-only there */}
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

      {/* form panel */}
      <div className="flex w-full items-center justify-center p-6 lg:w-1/2">
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
          <div className="mb-2 flex items-center gap-2 lg:hidden">
            <img src="/logo-icon.png" alt="" className="h-7 w-7 rounded-md" />
            <span className="font-display text-xl text-ink">Realm</span>
          </div>

          <div>
            <h2 className="font-display text-2xl text-ink">Welcome back</h2>
            <p className="text-sm text-ink-muted">Log in to continue</p>
          </div>

          {error && <p className="rounded-md bg-red-900/50 p-2 text-sm text-red-300">{error}</p>}

          {unverified && (
            <div className="space-y-2 rounded-md bg-gold/10 p-3 text-sm text-gold-light">
              <p>Your email isn't verified yet. Check your inbox for the link.</p>
              {resent ? (
                <p>Verification email resent.</p>
              ) : (
                <button type="button" onClick={handleResend} className="text-primary-light hover:underline">
                  Resend verification email
                </button>
              )}
            </div>
          )}

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
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary p-2 font-medium text-ink hover:bg-primary-hover disabled:opacity-40"
          >
            {loading ? "Logging in…" : "Log in"}
          </button>

          <p className="text-center text-sm text-ink-muted">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary-light hover:underline">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}