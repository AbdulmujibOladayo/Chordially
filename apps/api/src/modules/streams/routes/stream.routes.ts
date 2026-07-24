import { Router } from "express"
import { requireAuth } from "../../../shared/middleware/auth.middleware.js"
import { streamController } from "../controllers/stream.controller.js"

export const streamsRouter: Router = Router()

streamsRouter.post("/", requireAuth, streamController.start)
streamsRouter.post("/:id/end", requireAuth, streamController.end)
streamsRouter.get("/:id/tips", requireAuth, streamController.streamTips)
