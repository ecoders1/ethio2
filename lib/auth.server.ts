// Server-only auth helpers (uses next/headers - Node.js runtime only)
import { cookies } from "next/headers";
import { verifyJWT, type JWTPayload } from "./jwt";

export { verifyJWT, type JWTPayload };

export async function getAuthUser(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("eee_token")?.value;
  if (!token) return null;
  return verifyJWT(token);
}
