import { env } from "../../../shared/config/env.js"
import { createRateLimiter } from "../../../shared/rate-limit/rate-limiter.js"

export const tipFanRateLimiter = createRateLimiter({
  windowMs: env.TIP_RATE_LIMIT_WINDOW_MS,
  max: env.TIP_RATE_LIMIT_PER_FAN,
})

export const tipStreamRateLimiter = createRateLimiter({
  windowMs: env.TIP_RATE_LIMIT_WINDOW_MS,
  max: env.TIP_RATE_LIMIT_PER_STREAM,
})
