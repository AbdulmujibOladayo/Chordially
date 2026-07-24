import { createApp } from "./app.js"
import { reconciliationService } from "./modules/reconciliation/services/reconciliation.service.js"
import { env } from "./shared/config/env.js"
import { logger } from "./shared/logger/logger.js"

const app = createApp()

app.listen(env.PORT, () => {
  logger.info(`API listening on port ${env.PORT}`)
})

if (env.RECONCILIATION_ENABLED) {
  const interval = setInterval(() => {
    reconciliationService.run().catch((error) => {
      logger.error("Reconciliation run threw", {
        error: error instanceof Error ? error.message : String(error),
      })
    })
  }, env.RECONCILIATION_INTERVAL_MS)

  // Don't let the interval keep the process alive on its own (relevant for
  // graceful shutdown / test harnesses that import this module).
  interval.unref()
}
