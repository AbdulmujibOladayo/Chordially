import crypto from "node:crypto";
import { env } from "../../config/env.js";

interface TokenPayload {
  sub: string;
  exp: number;
}

export function signToken(userId: string) {
  const payload: TokenPayload = {
    sub: userId,
    exp: Date.now() + 1000 * 60 * 60 * 24
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", env.SESSION_SECRET)
    .update(encodedPayload)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
}

export function verifyToken(token: string) {
  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = crypto
    .createHmac("sha256", env.SESSION_SECRET)
    .update(encodedPayload)
    .digest("base64url");

  if (signature !== expectedSignature) {
    return null;
  }

  const payload = JSON.parse(
    Buffer.from(encodedPayload, "base64url").toString("utf8")
  ) as TokenPayload;

  if (payload.exp < Date.now()) {
    return null;
  }

  return payload.sub;
}
