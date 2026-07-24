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
    setupFiles: ["./tests/setup.ts"],
    testTimeout: 10000,
    // Tests share a single SQLite file; run test files sequentially to
    // avoid concurrent-write lock errors against that shared database.
    fileParallelism: false,
  },
})
