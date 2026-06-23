// Client-safe auth utilities (no next/headers, no bcrypt for client)
export { signJWT, verifyJWT, type JWTPayload } from "./jwt";

// Bcrypt helpers - server only, but OK since no next/headers
import bcrypt from "bcryptjs";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateDeviceId(): string {
  if (typeof window === "undefined") return "";
  const nav = window.navigator;
  const screen = window.screen;
  const deviceString = [
    nav.userAgent,
    nav.language,
    screen.colorDepth,
    screen.width + "x" + screen.height,
    new Date().getTimezoneOffset(),
    nav.hardwareConcurrency || "",
  ].join("|");
  let hash = 0;
  for (let i = 0; i < deviceString.length; i++) {
    const char = deviceString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}
