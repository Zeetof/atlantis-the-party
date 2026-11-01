import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { ADMIN_COOKIE, signSession, verifySession, type AdminSession } from "@/lib/session";
import { prisma } from "@/server/db";

export type { AdminSession };

export async function verifyAdminCredentials(email: string, password: string) {
  const admin = await prisma.adminUser.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!admin || !admin.active) return null;
  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) return null;
  return { id: admin.id, email: admin.email, name: admin.name, role: admin.role };
}

export async function establishSession(session: AdminSession) {
  const token = await signSession(session);
  cookies().set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export function clearSession() {
  cookies().delete(ADMIN_COOKIE);
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}

export async function requireRole(...roles: string[]): Promise<AdminSession> {
  const session = await requireAdmin();
  if (!roles.includes(session.role)) {
    throw new Error("You do not have permission to perform this action.");
  }
  return session;
}
