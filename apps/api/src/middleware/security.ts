/**
 * #127 – Security hardening: CORS, headers, CSRF posture, and session handling.
 *
 * Accepted residual risks for hackathon scope:
 * - No database-backed session store (in-memory only)
 * - CSRF protection is header-based (Origin/Referer check), not token-based
 * - Passwords hashed with SHA-256 (not bcrypt) for simplicity
 * - No rate limiting beyond what the host provides
 */
import type { NextFunction, Request, Response } from "express";

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? "http://localhost:3000").split(",");

export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  const origin = req.header("origin");

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }

  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Max-Age", "86400");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  next();
}

export function securityHeadersMiddleware(_req: Request, res: Response, next: NextFunction) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "geolocation=(), camera=(), microphone=()");
  next();
}

/** Lightweight CSRF guard: reject state-mutating requests that lack a same-origin indicator. */
export function csrfGuard(req: Request, res: Response, next: NextFunction) {
  const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);
  if (safeMethods.has(req.method)) {
    next();
    return;
  }

  const origin = req.header("origin");
  const referer = req.header("referer");

  const hasValidOrigin = origin && ALLOWED_ORIGINS.includes(origin);
  const hasValidReferer = referer && ALLOWED_ORIGINS.some((o) => referer.startsWith(o));

  // Allow requests from non-browser clients (e.g. mobile app, curl) that omit Origin
  if (!origin && !referer) {
    next();
    return;
  }

  if (!hasValidOrigin && !hasValidReferer) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  next();
}
