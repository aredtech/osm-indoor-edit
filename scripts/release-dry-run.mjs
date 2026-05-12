import { spawnSync } from "node:child_process";

const commands = [
  "pnpm build",
  "pnpm typecheck",
  "pnpm test",
  "pnpm build:examples",
  "pnpm test:e2e:leaflet",
  "pnpm test:e2e:maplibre",
  "pnpm check:core-boundary"
];

for (const commandLine of commands) {
  const [command, ...args] = commandLine.split(" ");
  console.log(`\n> ${commandLine}`);
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32"
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log("\nRelease dry-run passed.");
