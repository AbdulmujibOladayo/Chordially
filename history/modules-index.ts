/**
 * Issue #73 – Add fan tip history and receipt page
 *
 * File destination: apps/api/src/modules/index.ts  (replaces existing)
 *
 * Change summary:
 *  - Registers tipRouter so all three tip-related endpoints are reachable
 */

import type { Express } from "express";
import { healthRouter } from "./apps/api/src/modules/health/health.routes.js";
import { systemRouter } from "./apps/api/src/modules/system/system.routes.js";
import { tipRouter } from "./tip-routes.js";

export function registerModules(app: Express) {
  app.use("/health", healthRouter);
  app.use("/system", systemRouter);
  // tip history:  GET /tips/history
  // session feed: GET /sessions/:id/tips/feed
  // leaderboard:  GET /sessions/:id/leaderboard
  app.use("/", tipRouter);
}
