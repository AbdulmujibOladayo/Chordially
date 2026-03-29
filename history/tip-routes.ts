/**
 * Issue #73 – Add fan tip history and receipt page
 * Issue #71 – Build the live tip feed component (session feed endpoint)
 * Issue #72 – Add supporter leaderboard computation (leaderboard endpoint)
 *
 * File destination: apps/api/src/modules/tips/tip.routes.ts
 *
 * Register in apps/api/src/modules/index.ts:
 *   import { tipRouter } from "./tips/tip.routes.js";
 *   app.use("/tips", tipRouter);
 *   app.use("/sessions", tipRouter); // session-scoped routes live on same router
 *
 * Endpoints:
 *   GET /tips/history               – fan's own tip history (requireAuth)
 *   GET /sessions/:id/tips/feed     – confirmed tips for a session (public)
 *   GET /sessions/:id/leaderboard   – ranked supporters for a session (public)
 */

import { Router } from "express";
import { requireAuth } from "../apps/api/src/modules/auth/auth.middleware.js";
import {
  getTipsBySession,
  getTipHistoryByFan,
  getLeaderboard,
} from "./tip-store.js";
import type { TipStatus } from "./tip-store.js";

export const tipRouter = Router();

// ─── GET /tips/history ────────────────────────────────────────────────────────
// Returns the authenticated fan's tip history.
// Query params:
//   status  – CONFIRMED | FAILED | PENDING (optional)
//   from    – ISO date lower bound (optional)
//   to      – ISO date upper bound (optional)

tipRouter.get("/tips/history", requireAuth, (req, res) => {
  const user = req.authUser!;

  const { status, from, to } = req.query as {
    status?: string;
    from?: string;
    to?: string;
  };

  const validStatuses: TipStatus[] = ["DRAFT", "PENDING", "CONFIRMED", "FAILED"];
  const tipStatus =
    status && validStatuses.includes(status as TipStatus)
      ? (status as TipStatus)
      : undefined;

  const history = getTipHistoryByFan({
    fanId: user.id,
    status: tipStatus,
    from,
    to,
  });

  res.json({ items: history, total: history.length });
});

// ─── GET /sessions/:sessionId/tips/feed ───────────────────────────────────────
// Returns the latest confirmed tips for a session (public – no auth required).
// Query params:
//   limit – max items to return (default 20, max 100)

tipRouter.get("/sessions/:sessionId/tips/feed", (req, res) => {
  const { sessionId } = req.params;
  const rawLimit = parseInt(req.query.limit as string, 10);
  const limit = isNaN(rawLimit) ? 20 : Math.min(rawLimit, 100);

  const feed = getTipsBySession(sessionId).slice(0, limit);

  res.json({ items: feed, sessionId });
});

// ─── GET /sessions/:sessionId/leaderboard ─────────────────────────────────────
// Returns ranked supporters by confirmed tip total for a session (public).

tipRouter.get("/sessions/:sessionId/leaderboard", (req, res) => {
  const { sessionId } = req.params;
  const leaderboard = getLeaderboard(sessionId);

  res.json({ items: leaderboard, sessionId });
});
