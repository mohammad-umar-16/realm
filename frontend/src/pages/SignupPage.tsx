import { useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch, ApiRequestError } from "../lib/api";

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
      <div className="flex h-screen items-center justify-center bg-bg p-6 text-center">
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
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-bg">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-xl bg-surface p-6">
        <h1 className="font-display text-xl text-ink">Join Realm</h1>

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
  );
}