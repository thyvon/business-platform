import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { z } from "zod";

const directory = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(directory, "../../../../.env") });

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().int().positive().default(4000),
  WEB_ORIGIN: z.url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1),
  SESSION_TTL_HOURS: z.coerce.number().int().min(1).max(720).default(12),
  SMTP_HOST: z.string().default(""),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().default(""),
  SMTP_PASS: z.string().default(""),
  SMTP_FROM: z.string().email().default("noreply@business-platform.local"),
});

const parsed = environmentSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment configuration", z.treeifyError(parsed.error));
  throw new Error("Environment validation failed.");
}

const smtpConfigured = !!(parsed.data.SMTP_HOST && parsed.data.SMTP_USER && parsed.data.SMTP_PASS);

export const env = Object.freeze({
  nodeEnv: parsed.data.NODE_ENV,
  port: parsed.data.API_PORT,
  webOrigin: parsed.data.WEB_ORIGIN,
  databaseUrl: parsed.data.DATABASE_URL,
  sessionTtlMs: parsed.data.SESSION_TTL_HOURS * 60 * 60 * 1_000,
  isProduction: parsed.data.NODE_ENV === "production",
  smtp: {
    host: parsed.data.SMTP_HOST,
    port: parsed.data.SMTP_PORT,
    user: parsed.data.SMTP_USER,
    pass: parsed.data.SMTP_PASS,
    from: parsed.data.SMTP_FROM,
    configured: smtpConfigured,
  },
});
