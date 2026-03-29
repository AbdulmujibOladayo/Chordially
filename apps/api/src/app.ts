import express from "express";
import { auditMiddleware } from "./audit-middleware.js";
import { listAuditEvents } from "./audit-store.js";
import { registerModules } from "./modules/index.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFoundHandler } from "./middleware/not-found.js";

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(auditMiddleware);

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.post("/profile", (req, res) => {
    res.status(201).json({
      id: "profile-demo",
      ...req.body
    });
  });

  app.patch("/profile/:id", (req, res) => {
    res.status(200).json({
      id: req.params.id,
      ...req.body
    });
  });

  app.get("/audit", (_req, res) => {
    res.status(200).json({
      items: listAuditEvents()
    });
  });
  app.disable("x-powered-by");
  app.use(express.json());

  registerModules(app);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
