import type { Request, Response, NextFunction } from "express";
import { verifyToken, SESSION_COOKIE, type JwtPayload } from "../lib/auth.js";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[SESSION_COOKIE];
  const payload = token ? verifyToken(token) : null;

  if (!payload) return res.status(401).json({ error: "not authenticated" });

  req.user = payload;
  next();
}