# Video Translate

Real-time video calling + chat with live speech translation (captions + optional voice-over), built solo as a rebuild/extension of a published research paper ("Speech Translation Technology In Chatting And Video Conference Platform", IJSREM 2025).

## Stack
- **Frontend:** React (Vite) + TypeScript + Tailwind, Zustand, raw WebRTC
- **Backend:** Node.js + Express + Socket.io (signaling, chat, TURN credentials, Gemini translation proxy)
- **STT:** Web Speech API (Chrome/Edge) with a self-hosted Whisper fallback (Firefox/Safari) via FastAPI + faster-whisper
- **Translation:** Gemini API (proxied server-side to keep the key off the client)
- **DB:** Postgres via Neon (Drizzle ORM) — rooms, participants, chat/caption history
- **NAT traversal:** STUN + self-hosted coturn TURN server, time-limited HMAC credentials (RFC-style REST API auth, no static password)

## Architecture

```
frontend (Vite) ──┬── Socket.io ──> backend ──> Postgres (Neon)
                   │                  │
                   │                  ├──> Gemini API (translation)
                   │                  └──> mints short-lived TURN creds
                   │
                   ├── WebRTC (P2P audio/video, via STUN/TURN) ──> peer browser
                   │
                   └── (Firefox/Safari only) audio chunks ──> whisper-service (FastAPI)
```

Each participant recognizes and broadcasts their own speech in their own spoken language; every receiver translates incoming captions/chat into their own preferred language locally. This means the design already generalizes to group calls with mixed languages, not just 1:1.

## Local development

1. **Database:** create a free Neon Postgres project, copy the connection string.
2. **Gemini API key:** get one from Google AI Studio.
3. **TURN secret:** `openssl rand -hex 32` — put the same value in `backend/.env` (`TURN_SECRET`) and `coturn/turnserver.conf` (`static-auth-secret`).

```bash
# backend
cd backend && cp .env.example .env   # fill in DATABASE_URL, GEMINI_API_KEY, TURN_SECRET
npm install
npm run db:push                       # push schema to Neon
npm run dev                           # http://localhost:4000

# whisper-service
cd whisper-service && cp .env.example .env
pip install -r requirements.txt
uvicorn main:app --reload             # http://localhost:8000

# frontend
cd frontend && cp .env.example .env
npm install
npm run dev                           # http://localhost:5173
```

TURN server (optional for local same-network testing, required for real-world NAT traversal):
```bash
docker compose up coturn
```

Open two browser tabs at `localhost:5173`, join the same room code with different names/languages.

## Deployment (suggested, all free-tier-friendly)
| Service | Platform |
|---|---|
| Frontend | Vercel |
| Backend | Render / Railway |
| whisper-service | Render (needs more CPU than free tier typically offers — a paid starter instance is realistically required for usable latency) |
| Database | Neon (already cloud) |
| TURN | Self-hosted coturn on a small VPS, or a managed TURN provider (Twilio, metered.ca) |

Set `CLIENT_ORIGIN` (backend) and `VITE_BACKEND_URL` / `VITE_WHISPER_URL` (frontend) to the deployed URLs.

## Known limitations
- Whisper fallback is chunked (~4s), not truly streaming — there's an inherent latency floor on Firefox/Safari
- Group calls beyond 1:1 aren't load-tested; the mesh WebRTC topology (every peer connects to every peer) doesn't scale much past 4-5 participants — an SFU (e.g. mediasoup) would be the next architectural step
- No authentication — anyone with a room code can join
