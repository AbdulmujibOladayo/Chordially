import { Router } from "express"
import { requireAuth } from "../middleware/auth.middleware.js"
import { metrics } from "./metrics.js"

export const metricsRouter: Router = Router()

// Gated behind the same user auth as the rest of the API for now. A real
// deployment would put this behind a separate internal-only network
// boundary or scrape API key instead of a fan/creator JWT.
metricsRouter.get("/", requireAuth, (_req, res) => {
  res.status(200).json(metrics.getSnapshot())
})
