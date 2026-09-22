import { Router } from "express";

const router = Router();

router.get("/turn-credentials", async (_req, res) => {
  const appName = process.env.METERED_APP_NAME;
  const apiKey = process.env.METERED_API_KEY;

  if (!appName || !apiKey) {
    return res.json({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
  }

  try {
    const resp = await fetch(`https://${appName}.metered.live/api/v1/turn/credentials?apiKey=${apiKey}`);
    if (!resp.ok) throw new Error(`Metered request failed: ${resp.status}`);
    const iceServers = await resp.json();
    res.json({ iceServers });
  } catch (err) {
    console.error("Metered TURN fetch failed:", err);
    res.json({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
  }
});

export default router;