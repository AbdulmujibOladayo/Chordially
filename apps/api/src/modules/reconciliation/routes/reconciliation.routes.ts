import { Router } from "express"
import { requireAuth } from "../../../shared/middleware/auth.middleware.js"
import { reconciliationController } from "../controllers/reconciliation.controller.js"

export const reconciliationRouter: Router = Router()

// Manual trigger, mainly for demos/ops; the scheduled loop in server.ts
// calls reconciliationService.run() on the same interval automatically.
reconciliationRouter.post("/run", requireAuth, reconciliationController.run)
