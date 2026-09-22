# Realm

Real-time video calling with live speech translation — talk to anyone, in any language, face to face.

**Live app:** [realm-vchat.vercel.app](https://realm-vchat.vercel.app)

Built as a solo full-stack project, extending research previously published in *"Speech Translation Technology In Chatting And Video Conference Platform"* (IJSREM, 2025) into a production system with accounts, contacts, real-time messaging, and call history.

## Features

- **Live video calling** — WebRTC peer connections with STUN/TURN (via Metered.ca) for real-world NAT traversal, automatic ICE restart on network drops
- **Live captions + voice translation** — speech recognized via the Web Speech API (Chrome/Edge) with a self-hosted Whisper fallback for other browsers; captions translate into each participant's own language in real time, with optional spoken voice-over
- **Multi-provider translation pipeline** — DeepL (primary, 6 languages) → Sarvam AI (Hindi, purpose-built for Indian languages) → Gemini (final fallback, rotated across 4 model versions to multiply free-tier headroom), backed by a persistent, cross-user shared cache to cut redundant API calls
- **Accounts** — email/password signup, email verification via Resend, JWT sessions in httpOnly cookies
- **Contacts** — add by email, accept/decline requests, call or message any contact directly
- **Real-time direct messages** — translated the same way as in-call chat, delivered instantly via an authenticated Socket.io connection (not just polling)
- **Call history** — see who you talked to, when, and for how long

## Tech stack

**Frontend:** React (Vite) + TypeScript, Tailwind, Zustand, React Router
**Backend:** Node.js + Express + Socket.io, Drizzle ORM
**Database:** PostgreSQL (Neon)
**Auth:** JWT + httpOnly cookies, bcrypt, Resend for transactional email
**Translation:** DeepL, Sarvam AI, Gemini (with automatic fallback + shared caching)
**Speech-to-text:** Web Speech API + self-hosted Whisper (`faster-whisper`) fallback
**Real-time:** Socket.io (per-room signaling + per-user rooms for DMs), WebRTC
**TURN/STUN:** Metered.ca managed TURN
**Deployment:** Vercel (frontend), Render (backend), Neon (database)

## Architecture

```
frontend (Vercel) ──── Socket.io (authenticated via session cookie) ────┐
      │                                                                  │
      ├── REST API ──────────────────────────► backend (Render) ◄───────┘
      │                                              │
      ├── WebRTC (P2P via STUN/TURN) ──► peer         ├──► Postgres (Neon)
      │                                                ├──► DeepL / Sarvam / Gemini
      │                                                ├──► Resend (email)
      │                                                └──► Metered.ca (TURN credentials)
      │
      └── (Firefox/Safari only) audio chunks ──► self-hosted Whisper service
```

Each participant recognizes and broadcasts their own speech in their own language; every listener translates incoming captions/messages into their own preferred language on their end — this design generalizes to group conversations with mixed languages, not just 1:1.

## Local development

See [`SETUP.md`](./SETUP.md) *(or inline below)* for full local setup — you'll need accounts with Neon, Resend, Google AI Studio (Gemini), DeepL, Sarvam AI, and Metered.ca, all of which have usable free tiers.

```bash
# backend
cd backend && cp .env.example .env   # fill in your keys
npm install && npm run db:push && npm run dev

# frontend
cd frontend && cp .env.example .env
npm install && npm run dev
```

## Known limitations

- Real-time DMs use an authenticated Socket.io connection with a slower REST poll as a fallback safety net — not a full offline message queue
- Clicking "Call" on a contact creates a room but doesn't send them a live notification — the room code needs to be shared separately for now
- Mesh WebRTC topology (every peer connects to every peer) hasn't been load-tested past a handful of participants — an SFU (e.g. mediasoup) would be the next architectural step for larger group calls
- The Whisper fallback service isn't deployed in production (free-tier hosting doesn't have the RAM/CPU to run it reliably) — only affects Firefox/Safari users, since Chrome/Edge use the native Web Speech API

