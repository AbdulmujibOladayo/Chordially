import { Router } from "express"
import { requireAuth } from "../../../shared/middleware/auth.middleware.js"
import { userController } from "../controllers/user.controller.js"

export const usersRouter: Router = Router()

usersRouter.get("/me", requireAuth, userController.getMe)
usersRouter.patch("/me", requireAuth, userController.patchMe)
usersRouter.post("/me/avatar-upload-url", requireAuth, userController.getAvatarUploadUrl)
