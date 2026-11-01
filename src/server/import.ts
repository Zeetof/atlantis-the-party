import { randomBytes } from "node:crypto";
import { encryptString, last4, maskEmail } from "@/lib/crypto";
import { emailHash, normaliseTicketRef, ticketRefHash } from "@/lib/pii";
import type { AdminSession } from "@/lib/session";
import type { TicketImportInput } from "@/lib/validation";
import { prisma } from "@/server/db";
import { recordAudit } from "@/server/audit";

export type ImportResult = {
  imported: number;
  skipped: number;
  batch: string;
};

export async function importTicketRows(params: {
  input: TicketImportInput;
  session: AdminSession;
  ipHash?: string;
}): Promise<ImportResult> {
  const event = await prisma.event.findUnique({ where: { slug: "atlantis-4" } });
  if (!event) throw new Error("Atlantis 4.0 event configuration is missing.");

  const batch = `IMP-${randomBytes(6).toString("hex").toUpperCase()}`;
  const prepared = params.input.rows.map((row) => {
    const ref = normaliseTicketRef(row.providerRef);
    return {
      row,
      ref,
      refHash: ticketRefHash(ref),
      email: row.email,
      emailHash: emailHash(row.email),
    };
  });

  const existing = await prisma.ticketVerification.findMany({
    where: { providerRefHash: { in: prepared.map((item) => item.refHash) } },
    select: { providerRefHash: true },
  });
  const known = new Set(existing.map((item) => item.providerRefHash));

  let imported = 0;
  let skipped = 0;

  for (const item of prepared) {
    if (known.has(item.refHash)) {
      skipped += 1;
      continue;
    }

    try {
      await prisma.ticketVerification.create({
        data: {
          eventId: event.id,
          provider: "popout",
          providerRefHash: item.refHash,
          providerRefCipher: encryptString(item.ref),
          orderRefHash: item.refHash,
          orderRefLast4: last4(item.ref),
          purchaserEmailHash: item.emailHash,
          purchaserEmailMasked: maskEmail(item.email),
          purchaserEmailCipher: encryptString(item.email),
          quantity: item.row.quantity,
          status: "VERIFIED",
          source: "IMPORT",
          importBatch: batch,
          purchasedAt: item.row.purchasedAt ? new Date(item.row.purchasedAt) : null,
          verifiedAt: new Date(),
        },
      });
      known.add(item.refHash);
      imported += 1;
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        (error as { code?: string }).code === "P2002"
      ) {
        skipped += 1;
        continue;
      }
      throw error;
    }
  }

  await recordAudit({
    session: params.session,
    action: "TICKETS_IMPORTED",
    entity: "TicketVerification",
    entityId: batch,
    metadata: {
      imported,
      skipped,
      filename: params.input.filename ?? null,
      batch,
    },
    ipHash: params.ipHash,
  });

  return { imported, skipped, batch };
}
