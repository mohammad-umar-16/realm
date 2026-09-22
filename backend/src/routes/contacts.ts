import { Router } from "express";
import { eq, and, or } from "drizzle-orm";
import { db } from "../db/client.js";
import { contacts, users } from "../db/schema.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.post("/contacts", requireAuth, async (req, res) => {
  const { email } = req.body as { email?: string };
  const myId = req.user!.userId;
  if (!email) return res.status(400).json({ error: "email required" });

  const [target] = await db.select().from(users).where(eq(users.email, email));
  if (!target) return res.status(404).json({ error: "no account with that email" });
  if (target.id === myId) return res.status(400).json({ error: "can't add yourself" });

  const [existing] = await db
    .select()
    .from(contacts)
    .where(
      or(
        and(eq(contacts.requesterId, myId), eq(contacts.recipientId, target.id)),
        and(eq(contacts.requesterId, target.id), eq(contacts.recipientId, myId))
      )
    );
  if (existing) {
    return res.status(409).json({ error: existing.status === "accepted" ? "already a contact" : "request already pending" });
  }

  await db.insert(contacts).values({ requesterId: myId, recipientId: target.id });
  res.status(201).json({ message: "request sent" });
});

router.get("/contacts", requireAuth, async (req, res) => {
  const myId = req.user!.userId;

  const rows = await db
    .select()
    .from(contacts)
    .where(and(eq(contacts.status, "accepted"), or(eq(contacts.requesterId, myId), eq(contacts.recipientId, myId))));

  const otherIds = rows.map((r) => (r.requesterId === myId ? r.recipientId : r.requesterId));
  if (otherIds.length === 0) return res.json({ contacts: [] });

  const people = await db.select().from(users);
  const byId = new Map(people.map((p) => [p.id, p]));

  res.json({
    contacts: otherIds.map((id) => {
      const u = byId.get(id)!;
      return { id: u.id, displayName: u.displayName, email: u.email };
    }),
  });
});

router.get("/contacts/requests", requireAuth, async (req, res) => {
  const myId = req.user!.userId;

  const rows = await db
    .select()
    .from(contacts)
    .where(and(eq(contacts.status, "pending"), eq(contacts.recipientId, myId)));

  if (rows.length === 0) return res.json({ requests: [] });

  const people = await db.select().from(users);
  const byId = new Map(people.map((p) => [p.id, p]));

  res.json({
    requests: rows.map((r) => {
      const u = byId.get(r.requesterId)!;
      return { contactId: r.id, id: u.id, displayName: u.displayName, email: u.email };
    }),
  });
});

router.post("/contacts/:id/accept", requireAuth, async (req, res) => {
  const myId = req.user!.userId;
  const [row] = await db.select().from(contacts).where(eq(contacts.id, req.params.id));

  if (!row || row.recipientId !== myId || row.status !== "pending") {
    return res.status(404).json({ error: "request not found" });
  }

  await db.update(contacts).set({ status: "accepted", respondedAt: new Date() }).where(eq(contacts.id, row.id));
  res.json({ message: "accepted" });
});

router.post("/contacts/:id/decline", requireAuth, async (req, res) => {
  const myId = req.user!.userId;
  const [row] = await db.select().from(contacts).where(eq(contacts.id, req.params.id));

  if (!row || row.recipientId !== myId || row.status !== "pending") {
    return res.status(404).json({ error: "request not found" });
  }

  await db.delete(contacts).where(eq(contacts.id, row.id));
  res.json({ message: "declined" });
});

export default router;