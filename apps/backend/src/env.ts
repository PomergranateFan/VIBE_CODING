import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { z } from "zod";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = dirname(currentFilePath);
const envFilePath = resolve(currentDirPath, "..", ".env");
const shouldOverrideProcessEnv = process.env.NODE_ENV !== "production";

dotenv.config({
  path: envFilePath,
  override: shouldOverrideProcessEnv
});

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
  PORT: z.coerce.number().int().positive().default(5000),
  DATABASE_URL: z.string().min(1),
  N8N_WEBHOOK_URL: z.string().url(),
  CORS_ORIGINS: z.string().default("http://localhost:5173,http://127.0.0.1:5173")
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:");
  console.error(parsed.error.format());
  throw new Error("Environment validation failed");
}

const origins = parsed.data.CORS_ORIGINS.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (origins.length === 0) {
  throw new Error("CORS_ORIGINS must contain at least one origin");
}

export const env = {
  ...parsed.data,
  CORS_ORIGINS: origins
};
