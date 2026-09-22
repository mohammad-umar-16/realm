import { Router } from "express";
import { customAlphabet } from "nanoid";
import { db } from "../db/client.js";
import { rooms } from "../db/schema.js";
import { eq } from "drizzle-orm";

const router = Router();
// unambiguous alphabet (no 0/O/1/I) — room codes are typed/shared verbally sometimes
const genCode = customAlphabet("23456789ABCDEFGHJKLMNPQRSTUVWXYZ", 6);

router.post("/rooms", async (_req, res) => {
  const code = genCode();
  const [room] = await db.insert(rooms).values({ code }).returning();
  res.json({ roomCode: room.code });
});

router.get("/rooms/:code", async (req, res) => {
  const [room] = await db.select().from(rooms).where(eq(rooms.code, req.params.code));
  if (!room) return res.status(404).json({ error: "room not found" });
  res.json({ roomCode: room.code, active: !room.endedAt });
});

export default router;
