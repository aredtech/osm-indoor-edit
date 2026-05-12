import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  projects: [
    {
      name: "leaflet",
      testMatch: /leaflet-example\.spec\.ts/,
      use: {
        baseURL: "http://127.0.0.1:5173"
      }
    },
    {
      name: "maplibre",
      testMatch: /maplibre-example\.spec\.ts/,
      use: {
        baseURL: "http://127.0.0.1:5174"
      }
    }
  ],
  webServer: [
    {
      command: "pnpm --filter @osminedit-lib/example-leaflet dev -- --port 5173",
      url: "http://127.0.0.1:5173",
      reuseExistingServer: !process.env.CI
    },
    {
      command: "pnpm --filter @osminedit-lib/example-maplibre dev",
      url: "http://127.0.0.1:5174",
      reuseExistingServer: !process.env.CI
    }
  ]
});
