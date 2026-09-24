import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch, ApiRequestError } from "../lib/api";
import { useAuthStore, type AuthUser } from "../store/authStore";
import { BrandPanel } from "../components/Layout/BrandPanel";

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
      <BrandPanel />

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
            className="w-full rounded-md bg-surface-2 p-2 text-ink outline-none transition-colors placeholder:text-ink-muted focus:ring-1 focus:ring-primary-light"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="w-full rounded-md bg-surface-2 p-2 text-ink outline-none transition-colors placeholder:text-ink-muted focus:ring-1 focus:ring-primary-light"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary p-2 font-medium text-ink transition-colors hover:bg-primary-hover disabled:opacity-40"
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