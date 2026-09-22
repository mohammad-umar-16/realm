import "dotenv/config";
import express from "express";
import "express-async-errors";
import type { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { registerSignaling } from "./socket/signaling.js";
import { registerChat } from "./socket/chat.js";
import roomsRouter from "./routes/rooms.js";
import translateRouter from "./routes/translate.js";
import turnRouter from "./routes/turn.js";
import authRouter from "./routes/auth.js";
import contactsRouter from "./routes/contacts.js";
import dmRouter from "./routes/dm.js";
import historyRouter from "./routes/history.js";
import { verifyToken, SESSION_COOKIE } from "./lib/auth.js";

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/api", authRouter);
app.use("/api", contactsRouter);
app.use("/api", dmRouter);
app.use("/api", historyRouter);
app.use("/api", roomsRouter);
app.use("/api", translateRouter);
app.use("/api", turnRouter);
app.get("/health", (_req, res) => res.json({ ok: true }));

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("unhandled route error:", err);
  res.status(500).json({ error: "internal server error" });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: CLIENT_ORIGIN, credentials: true },
});
app.set("io", io);

io.use((socket, next) => {
  const cookieHeader = socket.handshake.headers.cookie;
  const match = cookieHeader?.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  const payload = match ? verifyToken(decodeURIComponent(match[1])) : null;

  if (!payload) return next(new Error("unauthenticated"));

  socket.data.userId = payload.userId;
  next();
});

io.on("connection", (socket) => {
  socket.join(`user:${socket.data.userId}`);

  registerSignaling(io, socket);
  registerChat(io, socket);
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => console.log(`Backend listening on :${PORT}`));

process.on("unhandledRejection", (err) => console.error("unhandled rejection:", err));
process.on("uncaughtException", (err) => console.error("uncaught exception:", err));