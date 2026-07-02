import { prisma } from "../../../shared/database/prisma.js"
import type {
  CreateCreatorInput,
  CreatorProfile,
  UpdateCreatorInput,
} from "../types/creator.types.js"

export const creatorRepository = {
  findById(id: string): Promise<CreatorProfile | null> {
    return prisma.creatorProfile.findUnique({ where: { id } })
  },

  findBySlug(slug: string): Promise<CreatorProfile | null> {
    return prisma.creatorProfile.findUnique({ where: { slug } })
  },

  findByUserId(userId: string): Promise<CreatorProfile | null> {
    return prisma.creatorProfile.findUnique({ where: { userId } })
  },

  create(input: CreateCreatorInput & { slug: string }): Promise<CreatorProfile> {
    return prisma.creatorProfile.create({
      data: {
        userId: input.userId,
        displayName: input.displayName,
        slug: input.slug,
        bio: input.bio,
        genre: input.genre,
        location: input.location,
      },
    })
  },

  update(id: string, input: UpdateCreatorInput): Promise<CreatorProfile> {
    return prisma.creatorProfile.update({
      where: { id },
      data: input,
    })
  },
}
