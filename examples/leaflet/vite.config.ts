import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@osminedit-lib/core": fileURLToPath(
        new URL("../../packages/core/src/index.ts", import.meta.url)
      ),
      "@osminedit-lib/leaflet": fileURLToPath(
        new URL("../../packages/leaflet/src/index.ts", import.meta.url)
      ),
      "@osminedit-lib/example-vanilla": fileURLToPath(
        new URL("../vanilla/src/main.ts", import.meta.url)
      )
    }
  }
});
