import { Router } from "express"
import { creatorController } from "../controllers/creator.controller.js"

export const creatorsRouter: Router = Router()

creatorsRouter.get("/:slug", creatorController.getBySlug)
