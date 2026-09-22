import { Router } from "express";
import crypto from "node:crypto";

const router = Router();
const TTL_SECONDS = 3600; // credentials expire after 1hr — limits blast radius if leaked client-side

router.get("/turn-credentials", (_req, res) => {
  const secret = process.env.TURN_SECRET;
  const turnUrl = process.env.TURN_URL;
  if (!secret || !turnUrl) {
    return res.json({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] }); // STUN-only fallback
  }

  // username = "<expiry-timestamp>:<label>" per coturn's REST API auth convention —
  // coturn recomputes this same HMAC server-side to validate, so no shared DB needed
  const username = `${Math.floor(Date.now() / 1000) + TTL_SECONDS}:webrtc`;
  const credential = crypto.createHmac("sha1", secret).update(username).digest("base64");

  res.json({
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: turnUrl, username, credential },
    ],
  });
});

export default router;
