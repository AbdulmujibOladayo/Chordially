import type { NextFunction, Request, Response } from "express"
import { creatorService } from "../services/creator.service.js"
import { toCreatorResponse } from "../types/creator.types.js"
import { AppError } from "../../../shared/errors/app-error.js"

export const creatorController = {
  async getBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params
      const profile = await creatorService.findBySlug(slug!)

      if (!profile) {
        throw new AppError(404, "CREATOR_NOT_FOUND", "Creator profile not found")
      }

      res.status(200).json(toCreatorResponse(profile))
    } catch (error) {
      next(error)
    }
  },
}
