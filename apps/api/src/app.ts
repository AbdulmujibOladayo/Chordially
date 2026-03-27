import express from "express";
import { authRouter } from "./modules/auth/auth.routes.js";
import { healthRouter } from "./modules/health.routes.js";
import { errorHandler } from "./middleware/error-handler.js";

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use("/health", healthRouter);
  app.use("/auth", authRouter);
  app.use(errorHandler);

  return app;
}
