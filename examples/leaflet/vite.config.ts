import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@aredtech/osm-indoor-edit": fileURLToPath(
        new URL("../../packages/core/src/index.ts", import.meta.url)
      ),
      "@aredtech/osm-indoor-edit-leaflet": fileURLToPath(
        new URL("../../packages/leaflet/src/index.ts", import.meta.url)
      ),
      "@aredtech/osm-indoor-edit-example-vanilla": fileURLToPath(
        new URL("../vanilla/src/main.ts", import.meta.url)
      )
    }
  }
});
