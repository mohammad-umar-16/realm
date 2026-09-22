import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { apiFetch, ApiRequestError } from "../lib/api";
import { useAuthStore, type AuthUser } from "../store/authStore";

type Status = "verifying" | "success" | "error";

export function VerifyPage() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState<Status>("verifying");
  const [message, setMessage] = useState("");
  const setUser = useAuthStore((s) => s.setUser);
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setStatus("error");
      setMessage("Missing verification token.");
      return;
    }

    apiFetch<{ user: AuthUser }>("/api/auth/verify", { method: "POST", body: JSON.stringify({ token }) })
      .then((res) => {
        setUser(res.user);
        setStatus("success");
        setTimeout(() => navigate("/"), 1500);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err instanceof ApiRequestError ? err.message : "verification failed");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-screen items-center justify-center bg-bg p-6 text-center">
      <div className="max-w-sm space-y-3">
        {status === "verifying" && <p className="text-ink">Verifying your email…</p>}
        {status === "success" && <p className="text-ink">Email verified — redirecting…</p>}
        {status === "error" && (
          <>
            <p className="text-red-300">{message}</p>
            <Link to="/login" className="text-primary-light hover:underline">
              Back to login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}