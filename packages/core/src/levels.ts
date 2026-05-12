import type { FeatureRecord } from "./feature-store";

export function parseRepeatOn(value?: string): string[] {
  return (value ?? "")
    .split(/[;,]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function isFeatureVisibleOnLevel(
  feature: FeatureRecord,
  level: string | undefined
): boolean {
  if (level === undefined) {
    return true;
  }

  return (
    feature.level === level ||
    feature.tags.level === level ||
    parseRepeatOn(feature.tags.repeat_on).includes(level)
  );
}
