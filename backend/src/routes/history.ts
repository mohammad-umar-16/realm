import { Router } from "express";
import { eq, desc, and, ne } from "drizzle-orm";
import { db } from "../db/client.js";
import { participants, rooms } from "../db/schema.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.get("/history", requireAuth, async (req, res) => {
  const myId = req.user!.userId;

  const myParticipations = await db
    .select()
    .from(participants)
    .where(eq(participants.userId, myId))
    .orderBy(desc(participants.joinedAt))
    .limit(50);

  if (myParticipations.length === 0) return res.json({ history: [] });

  const roomIds = [...new Set(myParticipations.map((p) => p.roomId))];
  const roomRows = await db.select().from(rooms);
  const roomsById = new Map(roomRows.map((r) => [r.id, r]));

  const allOtherParticipants = await db.select().from(participants).where(ne(participants.userId, myId));

  const history = myParticipations.map((p) => {
    const room = roomsById.get(p.roomId);
    const others = allOtherParticipants
      .filter((o) => o.roomId === p.roomId)
      .map((o) => o.displayName);

    const durationSeconds =
      p.leftAt && p.joinedAt ? Math.max(0, Math.round((new Date(p.leftAt).getTime() - new Date(p.joinedAt).getTime()) / 1000)) : null;

    return {
      roomCode: room?.code ?? "unknown",
      joinedAt: p.joinedAt,
      durationSeconds,
      withParticipants: [...new Set(others)],
    };
  });

  res.json({ history });
});

export default router;