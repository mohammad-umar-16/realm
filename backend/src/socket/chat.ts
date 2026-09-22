import type { Server, Socket } from "socket.io";
import { db } from "../db/client.js";
import { messages } from "../db/schema.js";
import type { ChatMessagePayload, CaptionPayload } from "../lib/types.js";

// translation happens client-side via /api/translate proxy before emitting,
// OR could be moved server-side later — kept client-driven for lower latency now
export function registerChat(io: Server, socket: Socket) {
  socket.on("chat-message", async (payload: ChatMessagePayload & { translatedText?: string; translatedLang?: string }) => {
    const { roomCode, text, lang, translatedText, translatedLang } = payload;
    const roomId = socket.data.roomId as string | undefined;
    const participantId = socket.data.participantId as string | undefined;
    if (!roomId || !participantId) return;

    io.to(roomCode).emit("chat-message", {
      fromSocketId: socket.id,
      text,
      lang,
      translatedText,
      translatedLang,
      createdAt: new Date().toISOString(),
    });

    await db
      .insert(messages)
      .values({
        roomId,
        senderId: participantId,
        type: "chat",
        originalText: text,
        originalLang: lang,
        translatedText,
        translatedLang,
      })
      .catch((err) => console.error("chat persist failed:", err));
  });

  // captions: broadcast every interim result for live feel, but only persist final ones
  socket.on("caption-update", async (payload: CaptionPayload & { translatedText?: string; translatedLang?: string }) => {
    const { roomCode, text, lang, isFinal, translatedText, translatedLang } = payload;
    const roomId = socket.data.roomId as string | undefined;
    const participantId = socket.data.participantId as string | undefined;
    if (!roomId || !participantId) return;

    socket.to(roomCode).emit("caption-update", {
      fromSocketId: socket.id,
      text,
      lang,
      isFinal,
      translatedText,
      translatedLang,
    });

    if (!isFinal) return; // skip DB write for interim results — avoids flooding table

    await db
      .insert(messages)
      .values({
        roomId,
        senderId: participantId,
        type: "caption",
        originalText: text,
        originalLang: lang,
        translatedText,
        translatedLang,
      })
      .catch((err) => console.error("caption persist failed:", err));
  });
}
