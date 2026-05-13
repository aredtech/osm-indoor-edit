import { expect, test } from "@playwright/test";

test("Leaflet example exposes host controls and export status", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("#map")).toBeVisible();
  await expect(page.locator(".leaflet-tile-pane")).toBeAttached();
  await expect(page.locator(".leaflet-tile-pane img").first()).toBeAttached();
  await expect(page.getByRole("button", { name: "Draw room" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Draw corridor" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add POI" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Finish" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Load sample" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Validate" })).toBeVisible();
  await expect(page.getByText("Category", { exact: true })).toBeVisible();
  await expect(page.getByText("Subcategory", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Feature preset")).toBeVisible();
  await expect(page.getByLabel("Geometry")).toBeVisible();
  await expect(page.getByRole("button", { name: "Draw preset" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Apply fields" })).toBeVisible();
  await expect(page.getByLabel("Snapping")).toBeVisible();
  await expect(page.getByLabel("Validation issues")).toBeVisible();
  await expect(page.getByLabel("Level")).toBeVisible();
  await expect(page.getByLabel("Export JSON")).toContainText('"status": true');

  await page.getByLabel("Level").selectOption("1");

  await expect(page.getByText("Level 1 ready")).toBeVisible();

  await page.getByRole("button", { name: "Load sample" }).click();
  await expect(page.getByText("Sample loaded")).toBeVisible();
  await expect(page.getByLabel("Export JSON")).toContainText("Room A");

  await page.getByRole("button", { name: "Validate" }).click();
  await expect(page.getByLabel("Validation issues")).toContainText("total");

  await page.locator('[data-role="preset-category"]').selectOption("Shops");
  await page.locator('[data-role="preset-subcategory"]').selectOption("Vehicles");
  await page.getByLabel("Feature preset").selectOption("shop-motorcycle");
  await page.getByLabel("Geometry").selectOption("polygon");
  await page.getByRole("button", { name: "Draw preset" }).click();
  const box = await page.locator("#map").boundingBox();
  if (!box) {
    throw new Error("Map bounding box unavailable");
  }
  await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.5);
  await page.mouse.click(box.x + box.width * 0.56, box.y + box.height * 0.5);
  await page.mouse.click(box.x + box.width * 0.53, box.y + box.height * 0.56);
  await page.getByRole("button", { name: "Finish" }).click();
  await page.getByRole("textbox", { name: "Name", exact: true }).fill("Ared Bikes");
  await page.getByRole("button", { name: "Apply fields" }).click();
  await expect(page.getByLabel("Export JSON")).toContainText('"shop": "motorcycle"');
  await expect(page.getByLabel("Export JSON")).toContainText("Ared Bikes");
});
