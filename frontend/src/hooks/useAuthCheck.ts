import { useEffect } from "react";
import { apiFetch, ApiRequestError } from "../lib/api";
import { useAuthStore, type AuthUser } from "../store/authStore";

export function useAuthCheck() {
  const setUser = useAuthStore((s) => s.setUser);
  const setUnauthenticated = useAuthStore((s) => s.setUnauthenticated);

  useEffect(() => {
    apiFetch<{ user: AuthUser }>("/api/auth/me")
      .then((res) => setUser(res.user))
      .catch((err) => {
        if (!(err instanceof ApiRequestError && err.status === 401)) console.error("auth check failed:", err);
        setUnauthenticated();
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}