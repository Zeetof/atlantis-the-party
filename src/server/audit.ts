import type { AdminSession } from "@/lib/session";
import { prisma } from "@/server/db";

type AuditInput = {
  session?: AdminSession | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  ipHash?: string;
};

export async function recordAudit({ session, action, entity, entityId, metadata, ipHash }: AuditInput) {
  try {
    await prisma.auditLog.create({
      data: {
        adminId: session?.id ?? null,
        actorEmail: session?.email ?? "system",
        action,
        entity,
        entityId: entityId ?? null,
        metadata: metadata ? JSON.stringify(metadata) : null,
        ipHash: ipHash ?? null,
      },
    });
  } catch (error) {
    console.error("Audit log write failed", error);
  }
}
