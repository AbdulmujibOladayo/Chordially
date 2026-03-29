import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  STELLAR_NETWORK: z.enum(["testnet", "mainnet"]).default("testnet"),
  STELLAR_HORIZON_URL: z.string().url("STELLAR_HORIZON_URL must be a valid URL"),
  SESSION_SECRET: z.string().min(8, "SESSION_SECRET must be at least 8 characters")
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
    .join("; ");

  throw new Error(`Invalid environment configuration: ${details}`);
}

export const env = parsed.data;
