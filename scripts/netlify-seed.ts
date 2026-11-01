import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function syncAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.log("ADMIN_EMAIL or ADMIN_PASSWORD is missing; owner credentials were not synced.");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.adminUser.upsert({
    where: { email },
    update: { name: "WESTHAN.ENT Owner", passwordHash, role: "OWNER", active: true },
    create: { email, name: "WESTHAN.ENT Owner", passwordHash, role: "OWNER" },
  });
  console.log(`Owner credentials synced for ${email}.`);
}

async function main() {
  const event = await prisma.event.findUnique({
    where: { slug: "atlantis-4" },
    select: { id: true },
  });

  if (event) {
    if (process.env.FORCE_SEED === "true") {
      console.log("FORCE_SEED is set; running the full seed and overwriting seeded content.");
      await import("../prisma/seed");
      return;
    }
    console.log("Database already seeded; skipping content seed to preserve organizer edits.");
    await syncAdmin();
    return;
  }

  await import("../prisma/seed");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
