import { prisma } from "../../../shared/database/prisma.js"
import type { SetPayoutConfigInput, StreamPayoutConfig } from "../types/payout-config.types.js"

export const streamPayoutConfigRepository = {
  findByStreamId(streamId: string): Promise<StreamPayoutConfig | null> {
    return prisma.streamPayoutConfig.findUnique({
      where: { streamId },
      include: { payees: true },
    })
  },

  /** Replaces any existing config for the stream with the given payees. */
  async set(input: SetPayoutConfigInput): Promise<StreamPayoutConfig> {
    return prisma.$transaction(async (tx) => {
      await tx.streamPayoutConfig.deleteMany({ where: { streamId: input.streamId } })

      return tx.streamPayoutConfig.create({
        data: {
          streamId: input.streamId,
          payees: {
            create: input.payees.map((payee) => ({
              creatorId: payee.creatorId,
              percentage: payee.percentage,
            })),
          },
        },
        include: { payees: true },
      })
    })
  },
}
