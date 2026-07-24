import type { NextFunction, Request, Response } from "express"
import { tipService } from "../services/tip.service.js"
import { createTipSchema } from "../validators/tip.validators.js"

export const tipController = {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const fanUserId = req.userId!
      const input = createTipSchema.parse(req.body)

      const tip = await tipService.submitTip({ ...input, fanUserId })

      res.status(201).json(tip)
    } catch (error) {
      next(error)
    }
  },
}
