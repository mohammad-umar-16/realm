import { describe, it, expect, vi } from "vitest";
import type { Request, Response } from "express";
import { requireAuth } from "./requireAuth.js";
import { signToken, SESSION_COOKIE } from "../lib/auth.js";

function makeMockRes() {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(payload: unknown) {
      res.body = payload;
      return res;
    },
  };
  return res as unknown as Response;
}

describe("requireAuth middleware", () => {
  it("calls next() and attaches req.user when the session cookie is valid", () => {
    const token = signToken({ userId: "user-1", email: "a@b.com" });
    const req = { cookies: { [SESSION_COOKIE]: token } } as unknown as Request;
    const res = makeMockRes();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.user?.userId).toBe("user-1");
  });

  it("returns 401 and does not call next() when there's no cookie at all", () => {
    const req = { cookies: {} } as unknown as Request;
    const res = makeMockRes();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });

  it("returns 401 when the cookie holds an invalid token", () => {
    const req = { cookies: { [SESSION_COOKIE]: "garbage" } } as unknown as Request;
    const res = makeMockRes();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });
});