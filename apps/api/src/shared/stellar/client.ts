import { HorizonStellarClient } from "@chordially/stellar"
import { env } from "../config/env.js"

export const stellarClient = new HorizonStellarClient({
  network: env.STELLAR_NETWORK,
  horizonUrl: env.STELLAR_HORIZON_URL,
  friendbotUrl: env.STELLAR_FRIENDBOT_URL,
})
