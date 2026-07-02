import { AppError } from "../../../shared/errors/app-error.js"
import { generateUniqueSlug } from "../../../shared/utils/slug.js"
import { creatorRepository } from "../repositories/creator.repository.js"
import type {
  CreateCreatorInput,
  CreatorProfile,
  UpdateCreatorInput,
} from "../types/creator.types.js"

export const creatorService = {
  findById(id: string): Promise<CreatorProfile | null> {
    return creatorRepository.findById(id)
  },

  findBySlug(slug: string): Promise<CreatorProfile | null> {
    return creatorRepository.findBySlug(slug)
  },

  findByUserId(userId: string): Promise<CreatorProfile | null> {
    return creatorRepository.findByUserId(userId)
  },

  async createCreatorProfile(input: CreateCreatorInput): Promise<CreatorProfile> {
    const existing = await creatorRepository.findByUserId(input.userId)
    if (existing) {
      throw new AppError(
        409,
        "CREATOR_PROFILE_EXISTS",
        "A creator profile already exists for this account"
      )
    }

    const slug = await generateUniqueSlug(
      input.displayName,
      creatorRepository.findBySlug
    )

    return creatorRepository.create({ ...input, slug })
  },

  async updateCreatorProfile(
    id: string,
    input: UpdateCreatorInput,
    requestingUserId: string
  ): Promise<CreatorProfile> {
    const profile = await creatorRepository.findById(id)
    if (!profile) {
      throw new AppError(404, "CREATOR_NOT_FOUND", "Creator profile not found")
    }

    if (profile.userId !== requestingUserId) {
      throw new AppError(
        403,
        "FORBIDDEN",
        "You do not have permission to edit this profile"
      )
    }

    return creatorRepository.update(id, input)
  },
}
