import { defineConfig } from "drizzle-kit";

try {
  process.loadEnvFile(".env");
} catch {
  // env may come from the shell instead
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  // Migrations need a direct connection, not the transaction pooler.
  dbCredentials: { url: process.env.POSTGRES_URL_NON_POOLING! },
});
