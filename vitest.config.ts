import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@osminedit-lib/core": fileURLToPath(new URL("./packages/core/src/index.ts", import.meta.url)),
      "@osminedit-lib/leaflet": fileURLToPath(
        new URL("./packages/leaflet/src/index.ts", import.meta.url)
      ),
      "@osminedit-lib/maplibre": fileURLToPath(
        new URL("./packages/maplibre/src/index.ts", import.meta.url)
      )
    }
  },
  test: {
    include: ["packages/**/*.test.ts"]
  }
});
