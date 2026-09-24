import { describe, it, expect } from "vitest";
import { hashPassword, comparePassword, signToken, verifyToken, cookieOptions } from "./auth.js";

describe("password hashing", () => {
  it("a hash never equals the plaintext password", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(hash).not.toBe("correct horse battery staple");
  });

  it("comparePassword succeeds for the original password", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(await comparePassword("correct horse battery staple", hash)).toBe(true);
  });

  it("comparePassword fails for a wrong password", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(await comparePassword("wrong password", hash)).toBe(false);
  });

  it("hashing the same password twice produces different hashes (salted)", async () => {
    const hashA = await hashPassword("same password");
    const hashB = await hashPassword("same password");
    expect(hashA).not.toBe(hashB);
  });
});

describe("session tokens", () => {
  const payload = { userId: "user-123", email: "test@example.com" };

  it("a signed token verifies back to the original payload", () => {
    const token = signToken(payload);
    const decoded = verifyToken(token);
    expect(decoded?.userId).toBe(payload.userId);
    expect(decoded?.email).toBe(payload.email);
  });

  it("a tampered token fails verification", () => {
    const token = signToken(payload);
    const tampered = token.slice(0, -3) + "xyz";
    expect(verifyToken(tampered)).toBeNull();
  });

  it("garbage input fails verification without throwing", () => {
    expect(verifyToken("not-a-real-jwt")).toBeNull();
  });
});

describe("cookieOptions", () => {
  it("is always httpOnly, regardless of environment", () => {
    expect(cookieOptions.httpOnly).toBe(true);
  });

  it("sets a 7-day expiry", () => {
    expect(cookieOptions.maxAge).toBe(7 * 24 * 60 * 60 * 1000);
  });
});