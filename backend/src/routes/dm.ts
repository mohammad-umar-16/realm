import { Router } from "express";
import type { Server } from "socket.io";
import { eq, and, or, desc } from "drizzle-orm";
import { db } from "../db/client.js";
import { dmMessages, users, contacts } from "../db/schema.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

async function assertContacts(myId: string, otherId: string) {
  const [row] = await db
    .select()
    .from(contacts)
    .where(
      and(
        eq(contacts.status, "accepted"),
        or(
          and(eq(contacts.requesterId, myId), eq(contacts.recipientId, otherId)),
          and(eq(contacts.requesterId, otherId), eq(contacts.recipientId, myId))
        )
      )
    );
  return !!row;
}

router.get("/dm/conversations", requireAuth, async (req, res) => {
  const myId = req.user!.userId;

  const contactRows = await db
    .select()
    .from(contacts)
    .where(and(eq(contacts.status, "accepted"), or(eq(contacts.requesterId, myId), eq(contacts.recipientId, myId))));

  const otherIds = contactRows.map((r) => (r.requesterId === myId ? r.recipientId : r.requesterId));
  if (otherIds.length === 0) return res.json({ conversations: [] });

  const people = await db.select().from(users);
  const byId = new Map(people.map((p) => [p.id, p]));

  const allMessages = await db.select().from(dmMessages).orderBy(desc(dmMessages.createdAt));

  const conversations = otherIds.map((otherId) => {
    const other = byId.get(otherId)!;
    const thread = allMessages.filter(
      (m) => (m.senderId === myId && m.recipientId === otherId) || (m.senderId === otherId && m.recipientId === myId)
    );
    const last = thread[0];
    const unreadCount = thread.filter((m) => m.recipientId === myId && !m.read).length;

    return {
      contactId: other.id,
      displayName: other.displayName,
      email: other.email,
      lastMessage: last ? { text: last.originalText, createdAt: last.createdAt, isOwn: last.senderId === myId } : null,
      unreadCount,
    };
  });

  conversations.sort((a, b) => {
    const at = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
    const bt = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
    return bt - at;
  });

  res.json({ conversations });
});

router.get("/dm/:contactId/messages", requireAuth, async (req, res) => {
  const myId = req.user!.userId;
  const otherId = req.params.contactId;

  if (!(await assertContacts(myId, otherId))) return res.status(403).json({ error: "not a contact" });

  const thread = await db
    .select()
    .from(dmMessages)
    .where(
      or(
        and(eq(dmMessages.senderId, myId), eq(dmMessages.recipientId, otherId)),
        and(eq(dmMessages.senderId, otherId), eq(dmMessages.recipientId, myId))
      )
    )
    .orderBy(dmMessages.createdAt);

  await db
    .update(dmMessages)
    .set({ read: true })
    .where(and(eq(dmMessages.senderId, otherId), eq(dmMessages.recipientId, myId), eq(dmMessages.read, false)));

  res.json({
    messages: thread.map((m) => ({
      id: m.id,
      text: m.originalText,
      lang: m.originalLang,
      isOwn: m.senderId === myId,
      createdAt: m.createdAt,
    })),
  });
});

router.post("/dm/:contactId/messages", requireAuth, async (req, res) => {
  const myId = req.user!.userId;
  const otherId = req.params.contactId;
  const { text } = req.body as { text?: string };
  if (!text?.trim()) return res.status(400).json({ error: "text required" });

  if (!(await assertContacts(myId, otherId))) return res.status(403).json({ error: "not a contact" });

  const [me] = await db.select().from(users).where(eq(users.id, myId));

  const [message] = await db
    .insert(dmMessages)
    .values({ senderId: myId, recipientId: otherId, originalText: text.trim(), originalLang: me.preferredLang })
    .returning();

  const responsePayload = { id: message.id, text: message.originalText, lang: message.originalLang, createdAt: message.createdAt };

  const io = req.app.get("io") as Server;
  io.to(`user:${otherId}`).emit("dm-message", { ...responsePayload, fromUserId: myId, toUserId: otherId });
  io.to(`user:${myId}`).emit("dm-message", { ...responsePayload, fromUserId: myId, toUserId: otherId });

  res.status(201).json({ message: { ...responsePayload, isOwn: true } });
});

export default router;