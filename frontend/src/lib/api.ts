const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

interface ApiError {
  error: string;
  code?: string;
}

export class ApiRequestError extends Error {
  code?: string;
  status: number;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const resp = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
  });

  const data = await resp.json().catch(() => ({}));

  if (!resp.ok) {
    const err = data as ApiError;
    throw new ApiRequestError(err.error || "request failed", resp.status, err.code);
  }

  return data as T;
}
