import path from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      "@chordially/shared": path.resolve(dirname, "../../packages/shared/src/index.ts"),
      "@chordially/stellar": path.resolve(dirname, "../../packages/stellar/src/index.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["e2e/**/*.test.ts"],
    setupFiles: ["./e2e/setup.ts"],
    // Real Horizon Testnet submissions wait for real ledger close times.
    testTimeout: 180_000,
    hookTimeout: 60_000,
    fileParallelism: false,
  },
})
