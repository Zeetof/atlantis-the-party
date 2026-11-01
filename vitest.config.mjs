import { fileURLToPath } from "node:url";

// Plain config object (no vitest/config import) so the loader stays lightweight.
export default {
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    env: {
      DATABASE_URL: "file:./prisma/test.db",
      AUTH_SECRET: "test-auth-secret-0123456789abcdef",
      APP_ENCRYPTION_KEY: "test-encryption-key-0123456789abcdef",
      TICKETING_WEBHOOK_SECRET: "test-webhook-secret-0123456789abcdef",
    },
  },
};
