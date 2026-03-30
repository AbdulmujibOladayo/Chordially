import express from "express";
import { auditMiddleware } from "./audit-middleware.js";
import { listAuditEvents } from "./audit-store.js";
import { registerModules } from "./modules/index.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFoundHandler } from "./middleware/not-found.js";
import { corsMiddleware, csrfGuard, securityHeadersMiddleware } from "./middleware/security.js";
import { createPaymentsRouter } from "./modules/payments.routes.js";
import { FakeStellarService } from "./services/stellar/fake-stellar.service.js";
import { MockStellarService } from "./services/stellar/mock-stellar.service.js";

const isDemoMode = process.env.DEMO_MODE === "true";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(corsMiddleware);
  app.use(securityHeadersMiddleware);
  app.use(csrfGuard);
  app.use(express.json());
  app.use(auditMiddleware);

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.post("/profile", (req, res) => {
    res.status(201).json({ id: "profile-demo", ...req.body });
  });

  app.patch("/profile/:id", (req, res) => {
    res.status(200).json({ id: req.params.id, ...req.body });
  });

  app.get("/audit", (_req, res) => {
    const { actor, action, from, to, limit, offset } = req.query as Record<string, string>;
    let items = listAuditEvents();

    if (actor) items = items.filter((e) => e.actor === actor);
    if (action) items = items.filter((e) => e.action.includes(action));
    if (from) items = items.filter((e) => e.createdAt >= from);
    if (to) items = items.filter((e) => e.createdAt <= to);

    const total = items.length;
    const off = Number(offset ?? 0);
    const lim = Math.min(Number(limit ?? 50), 200);

    res.status(200).json({ items: items.slice(off, off + lim), total, offset: off, limit: lim });
  });

  const stellarService = isDemoMode ? new MockStellarService() : new FakeStellarService();
  app.use("/payments", createPaymentsRouter(stellarService));

  registerModules(app);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
