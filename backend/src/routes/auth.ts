import { Router } from "express";
import crypto from "node:crypto";
import { eq, and } from "drizzle-orm";
import { db } from "../db/client.js";
import { users, verificationTokens } from "../db/schema.js";
import { hashPassword, comparePassword, signToken, cookieOptions, SESSION_COOKIE } from "../lib/auth.js";
import { sendVerificationEmail } from "../lib/resend.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();
const VERIFY_TOKEN_TTL_MS = 60 * 60 * 1000;

const toPublicUser = (u: typeof users.$inferSelect) => ({
  id: u.id,
  email: u.email,
  displayName: u.displayName,
  preferredLang: u.preferredLang,
});

async function createAndSendVerification(userId: string, email: string) {
  const token = crypto.randomBytes(32).toString("hex");
  await db.insert(verificationTokens).values({
    userId,
    token,
    purpose: "email_verify",
    expiresAt: new Date(Date.now() + VERIFY_TOKEN_TTL_MS),
  });
  await sendVerificationEmail(email, token);
}

router.post("/auth/signup", async (req, res) => {
  const { email, password, displayName } = req.body as { email?: string; password?: string; displayName?: string };
  if (!email || !password || !displayName) {
    return res.status(400).json({ error: "email, password, displayName required" });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "password must be at least 8 characters" });
  }

  const [existing] = await db.select().from(users).where(eq(users.email, email));
  if (existing) return res.status(409).json({ error: "email already registered" });

  const passwordHash = await hashPassword(password);
  const [user] = await db.insert(users).values({ email, passwordHash, displayName }).returning();

  try {
    await createAndSendVerification(user.id, user.email);
  } catch (err) {
    console.error("verification email failed:", err);
  }

  res.status(201).json({ message: "account created, check your email to verify" });
});

router.post("/auth/verify", async (req, res) => {
  const { token } = req.body as { token?: string };
  if (!token) return res.status(400).json({ error: "token required" });

  const [record] = await db
    .select()
    .from(verificationTokens)
    .where(and(eq(verificationTokens.token, token), eq(verificationTokens.purpose, "email_verify")));

  if (!record) return res.status(400).json({ error: "invalid or already-used token" });
  if (record.expiresAt < new Date()) return res.status(400).json({ error: "token expired" });

  const [user] = await db
    .update(users)
    .set({ emailVerified: true })
    .where(eq(users.id, record.userId))
    .returning();

  await db.delete(verificationTokens).where(eq(verificationTokens.id, record.id));

  const sessionToken = signToken({ userId: user.id, email: user.email });
  res.cookie(SESSION_COOKIE, sessionToken, cookieOptions);
  res.json({ user: toPublicUser(user) });
});

router.post("/auth/resend-verification", async (req, res) => {
  const { email } = req.body as { email?: string };
  if (!email) return res.status(400).json({ error: "email required" });

  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user || user.emailVerified) return res.json({ message: "if that account exists, an email was sent" });

  await createAndSendVerification(user.id, user.email).catch((err) => console.error("resend failed:", err));
  res.json({ message: "if that account exists, an email was sent" });
});

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) return res.status(400).json({ error: "email and password required" });

  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user || !(await comparePassword(password, user.passwordHash))) {
    return res.status(401).json({ error: "invalid email or password" });
  }
  if (!user.emailVerified) {
    return res.status(403).json({ error: "email not verified", code: "EMAIL_NOT_VERIFIED" });
  }

  const sessionToken = signToken({ userId: user.id, email: user.email });
  res.cookie(SESSION_COOKIE, sessionToken, cookieOptions);
  res.json({ user: toPublicUser(user) });
});

router.post("/auth/logout", (_req, res) => {
  res.clearCookie(SESSION_COOKIE, cookieOptions);
  res.json({ message: "logged out" });
});

router.get("/auth/me", requireAuth, async (req, res) => {
  const [user] = await db.select().from(users).where(eq(users.id, req.user!.userId));
  if (!user) return res.status(404).json({ error: "user not found" });
  res.json({ user: toPublicUser(user) });
});

router.patch("/auth/me", requireAuth, async (req, res) => {
  const { displayName, preferredLang } = req.body as { displayName?: string; preferredLang?: string };
  const updates: Partial<{ displayName: string; preferredLang: string }> = {};
  if (displayName?.trim()) updates.displayName = displayName.trim();
  if (preferredLang?.trim()) updates.preferredLang = preferredLang.trim();

  if (Object.keys(updates).length === 0) return res.status(400).json({ error: "nothing to update" });

  const [user] = await db.update(users).set(updates).where(eq(users.id, req.user!.userId)).returning();
  res.json({ user: toPublicUser(user) });
});

export default router;