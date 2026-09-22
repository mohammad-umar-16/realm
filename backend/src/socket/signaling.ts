import type { Server, Socket } from "socket.io";
import { db } from "../db/client.js";
import { rooms, participants } from "../db/schema.js";
import { eq } from "drizzle-orm";
import type { JoinRoomPayload, SignalPayload, PeerInfo } from "../lib/types.js";

const roomPeers = new Map<string, Map<string, PeerInfo>>();

export function registerSignaling(io: Server, socket: Socket) {
  socket.on("join-room", async (payload: JoinRoomPayload) => {
    const { roomCode, displayName, preferredLang } = payload;
    const userId = socket.data.userId as string | undefined;

    try {
      let [room] = await db.select().from(rooms).where(eq(rooms.code, roomCode));
      if (!room) {
        [room] = await db.insert(rooms).values({ code: roomCode }).returning();
      }

      const [participant] = await db
        .insert(participants)
        .values({ roomId: room.id, userId, displayName, preferredLang })
        .returning();

      socket.data.roomCode = roomCode;
      socket.data.participantId = participant.id;
      socket.data.roomId = room.id;

      socket.join(roomCode);

      if (!roomPeers.has(roomCode)) roomPeers.set(roomCode, new Map());
      const peers = roomPeers.get(roomCode)!;

      const existingPeers = Array.from(peers.values());
      socket.emit("existing-peers", existingPeers);

      const myInfo: PeerInfo = {
        socketId: socket.id,
        participantId: participant.id,
        displayName,
        preferredLang,
      };
      peers.set(socket.id, myInfo);

      socket.to(roomCode).emit("peer-joined", myInfo);
    } catch (err) {
      socket.emit("join-error", { message: "Failed to join room" });
      console.error("join-room error:", err);
    }
  });

  socket.on("signal", (payload: SignalPayload) => {
    io.to(payload.targetSocketId).emit("signal", {
      fromSocketId: socket.id,
      data: payload.data,
    });
  });

  // shared by both explicit "leave-room" (End Call button — the socket itself stays connected
  // for the rest of the app) and "disconnect" (tab closed, connection dropped)
  const leaveCurrentRoom = async () => {
    const roomCode = socket.data.roomCode as string | undefined;
    const participantId = socket.data.participantId as string | undefined;
    if (!roomCode) return;

    const peers = roomPeers.get(roomCode);
    peers?.delete(socket.id);
    if (peers && peers.size === 0) roomPeers.delete(roomCode);

    socket.to(roomCode).emit("peer-left", { socketId: socket.id });
    socket.leave(roomCode);

    socket.data.roomCode = undefined;
    socket.data.participantId = undefined;
    socket.data.roomId = undefined;

    if (participantId) {
      await db
        .update(participants)
        .set({ leftAt: new Date() })
        .where(eq(participants.id, participantId))
        .catch((err) => console.error("leftAt update failed:", err));
    }
  };

  socket.on("leave-room", leaveCurrentRoom);
  socket.on("disconnect", leaveCurrentRoom);
}