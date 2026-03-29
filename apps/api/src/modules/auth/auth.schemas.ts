import { z } from "zod";

const roleSchema = z.enum(["fan", "artist", "admin"]);

export const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(24).regex(/^[a-zA-Z0-9_-]+$/),
  password: z.string().min(8).max(72),
  role: roleSchema.optional().default("fan")
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72)
});
