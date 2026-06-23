// Edge-compatible JWT utilities (jose only, no bcrypt)
import { SignJWT, jwtVerify } from "jose";

export interface JWTPayload {
  userId: string;
  email: string;
  isAdmin: boolean;
  deviceId: string;
}

const getSecret = () =>
  new TextEncoder().encode(
    process.env.JWT_SECRET || "eee-exit-exam-ethiopia-secret-key-minimum-32chars"
  );

export async function signJWT(payload: JWTPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}
