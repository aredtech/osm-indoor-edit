import { expect, test } from "@playwright/test";

test("Leaflet example exposes host controls and export status", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("button", { name: "Draw room" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Draw corridor" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add POI" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Finish" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();
  await expect(page.getByLabel("Level")).toBeVisible();
  await expect(page.getByLabel("Export JSON")).toContainText('"status": true');

  await page.getByLabel("Level").selectOption("1");

  await expect(page.getByText("Level 1 ready")).toBeVisible();
});
