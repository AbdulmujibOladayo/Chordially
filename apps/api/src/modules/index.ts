import type { Express } from "express";
import { healthRouter } from "./health/health.routes.js";
import { systemRouter } from "./system/system.routes.js";

export function registerModules(app: Express) {
  app.use("/health", healthRouter);
  app.use("/system", systemRouter);
}
