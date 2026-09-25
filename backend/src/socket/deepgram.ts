import type { Server, Socket } from "socket.io";
import { DeepgramClient } from "@deepgram/sdk";

const client = new DeepgramClient({ apiKey: process.env.DEEPGRAM_API_KEY });

type DeepgramSocket = Awaited<ReturnType<typeof client.listen.v1.connect>>;
const activeSessions = new Map<string, DeepgramSocket>();

function closeSession(socketId: string) {
  const connection = activeSessions.get(socketId);
  if (!connection) return;
  activeSessions.delete(socketId);
  try {
    connection.sendCloseStream({ type: "CloseStream" });
  } catch (err) {
    console.error(`failed closing Deepgram session (${socketId}):`, err);
  }
}

export function registerDeepgram(_io: Server, socket: Socket) {
  socket.on("start-transcription", async ({ lang }: { lang: string }) => {
    closeSession(socket.id);

    try {
      const connection = await client.listen.v1.connect({
        model: "nova-3",
        language: lang,
        punctuate: "true",
        interim_results: "true",
        endpointing: 250,
      });

      connection.on("message", (data: any) => {
        if (data.type !== "Results") return;
        const transcript = data.channel?.alternatives?.[0]?.transcript;
        if (transcript) socket.emit("transcript", { text: transcript, isFinal: data.is_final });
      });

      connection.on("error", (err: unknown) => {
        console.error(`Deepgram error (${socket.id}):`, err);
        socket.emit("transcription-error", { message: "Deepgram connection lost" });
      });

      await connection.waitForOpen();
      activeSessions.set(socket.id, connection);
    } catch (err) {
      console.error("Failed to open Deepgram connection:", err);
      socket.emit("transcription-error", { message: "Deepgram unavailable" });
    }
  });

  socket.on("audio-chunk", (chunk: ArrayBuffer) => {
    activeSessions.get(socket.id)?.sendMedia(chunk);
  });

  socket.on("stop-transcription", () => closeSession(socket.id));
  socket.on("disconnect", () => closeSession(socket.id));
}