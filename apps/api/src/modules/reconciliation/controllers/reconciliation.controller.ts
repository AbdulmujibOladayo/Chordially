import type { NextFunction, Request, Response } from "express"
import { reconciliationService } from "../services/reconciliation.service.js"

export const reconciliationController = {
  async run(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const summary = await reconciliationService.run()
      res.status(200).json(summary)
    } catch (error) {
      next(error)
    }
  },
}
