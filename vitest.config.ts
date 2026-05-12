import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@aredtech/osm-indoor-edit": fileURLToPath(new URL("./packages/core/src/index.ts", import.meta.url)),
      "@aredtech/osm-indoor-edit-leaflet": fileURLToPath(
        new URL("./packages/leaflet/src/index.ts", import.meta.url)
      ),
      "@aredtech/osm-indoor-edit-maplibre": fileURLToPath(
        new URL("./packages/maplibre/src/index.ts", import.meta.url)
      )
    }
  },
  test: {
    include: ["packages/**/*.test.ts"]
  }
});
