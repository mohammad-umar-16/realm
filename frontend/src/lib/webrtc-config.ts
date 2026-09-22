const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

// TURN is required for real-world NAT traversal (mobile data, strict corporate NAT) —
// STUN alone fails silently on a meaningful chunk of real networks.
// Credentials are short-lived (see backend /api/turn-credentials) rather than a static
// hardcoded password, so a leaked client-side credential expires within the hour.
export async function fetchIceServers(): Promise<RTCIceServer[]> {
  try {
    const resp = await fetch(`${BACKEND_URL}/api/turn-credentials`);
    if (!resp.ok) throw new Error("turn-credentials request failed");
    const { iceServers } = await resp.json();
    return iceServers;
  } catch (err) {
    console.error("failed to fetch TURN credentials, falling back to STUN-only:", err);
    return [{ urls: "stun:stun.l.google.com:19302" }];
  }
}
