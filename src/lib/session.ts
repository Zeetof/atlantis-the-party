import { SignJWT, jwtVerify } from "jose";

export const ADMIN_COOKIE = "atp_admin";
const ISSUER = "atlantis-admin";
const AUDIENCE = "atlantis-admin";

export type AdminSession = {
  id: string;
  email: string;
  name: string;
  role: string;
};

function key() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET is not configured (minimum 32 characters).");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(session: AdminSession, ttl = "8h") {
  return new SignJWT({
    email: session.email,
    name: session.name,
    role: session.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.id)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(ttl)
    .sign(key());
}

export async function verifySession(token: string): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, key(), { issuer: ISSUER, audience: AUDIENCE });
    if (!payload.sub || typeof payload.email !== "string" || typeof payload.role !== "string") {
      return null;
    }
    return {
      id: payload.sub,
      email: payload.email,
      name: typeof payload.name === "string" ? payload.name : payload.email,
      role: payload.role,
    };
  } catch {
    return null;
  }
}
