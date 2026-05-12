import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const coreSrcDir = path.join(root, "packages/core/src");
const rendererPackages = ["leaflet", "maplibre", "maplibre-gl"];

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(root, relativePath), "utf8"));
}

async function listTypeScriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return listTypeScriptFiles(absolute);
      }
      return entry.isFile() && entry.name.endsWith(".ts") ? [absolute] : [];
    })
  );
  return files.flat();
}

function dependencyNames(packageJson) {
  return [
    ...Object.keys(packageJson.dependencies ?? {}),
    ...Object.keys(packageJson.peerDependencies ?? {}),
    ...Object.keys(packageJson.devDependencies ?? {}),
    ...Object.keys(packageJson.optionalDependencies ?? {})
  ];
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function importSpecifiers(source) {
  const specifiers = [];
  const importPattern = /(?:import|export)\s+(?:type\s+)?(?:[^"']*?\s+from\s+)?["']([^"']+)["']/g;
  for (const match of source.matchAll(importPattern)) {
    specifiers.push(match[1]);
  }
  return specifiers;
}

const corePackage = await readJson("packages/core/package.json");
for (const dependency of dependencyNames(corePackage)) {
  assert(
    !rendererPackages.includes(dependency),
    `@aredtech/osm-indoor-edit must not depend on renderer package ${dependency}`
  );
}

for (const file of await listTypeScriptFiles(coreSrcDir)) {
  const source = await readFile(file, "utf8");
  for (const specifier of importSpecifiers(source)) {
    assert(
      !rendererPackages.some((rendererPackage) => specifier === rendererPackage || specifier.startsWith(`${rendererPackage}/`)),
      `packages/core/src must not import renderer package ${specifier} in ${path.relative(root, file)}`
    );
  }
}

const leafletPackage = await readJson("packages/leaflet/package.json");
assert(
  leafletPackage.peerDependencies?.leaflet,
  "@aredtech/osm-indoor-edit-leaflet must list leaflet in peerDependencies"
);

const maplibrePackage = await readJson("packages/maplibre/package.json");
assert(
  maplibrePackage.peerDependencies?.["maplibre-gl"],
  "@aredtech/osm-indoor-edit-maplibre must list maplibre-gl in peerDependencies"
);

console.log("Core boundary check passed: packages/core/src is renderer-free.");
