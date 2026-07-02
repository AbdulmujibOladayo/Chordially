import express, { type Express } from "express"
import { authRouter } from "./modules/auth/routes/auth.routes.js"
import { creatorsRouter } from "./modules/creators/routes/creator.routes.js"
import { usersRouter } from "./modules/users/routes/user.routes.js"
import { errorHandler } from "./shared/middleware/error-handler.js"

export function createApp(): Express {
  const app = express()

  app.use(express.json())

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" })
  })

  app.use("/api/auth", authRouter)
  app.use("/api/creators", creatorsRouter)
  app.use("/api/users", usersRouter)

  app.use(errorHandler)

  return app
}
