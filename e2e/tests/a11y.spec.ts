import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const PAGES = [
  "/fr", "/en",
  "/fr/planifier?from=13055&to=06088&via=13001", "/en/plan?from=13055&to=06088&via=13001",
  "/fr/voyages", "/en/trips",
  "/fr/a-propos", "/en/about",
  "/fr/connexion", "/en/login",
  "/fr/profil", "/en/profile",
  "/fr/admin",
  "/fr/mentions-legales", "/en/legal-notice",
  "/fr/confidentialite", "/en/privacy",
  "/fr/conditions-utilisation", "/en/terms",
  "/fr/accessibilite", "/en/accessibility",
  "/fr/plan-du-site", "/en/sitemap",
  "/fr/page-inexistante",
];

for (const scheme of ["light", "dark"] as const) {
  test.describe(`axe WCAG 2.2 AA — ${scheme}`, () => {
    test.use({ colorScheme: scheme });
    for (const path of PAGES) {
      test(path, async ({ page }) => {
        await page.goto(path);
        await page.waitForLoadState("networkidle").catch(() => undefined);
        await page.waitForTimeout(path.includes("plan") ? 2500 : 600);
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
          // The WebGL canvas and the third-party basemap labels are documented as non-accessible content.
          .exclude(".maplibregl-canvas-container")
          .exclude(".maplibregl-ctrl-attrib")
          .analyze();
        const summary = results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).slice(0, 4).join(" | ")}`);
        expect(summary, summary.join("\n")).toEqual([]);
      });
    }
  });
}

test("feedback and share dialogs pass axe", async ({ page }) => {
  const axe = () => new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).exclude(".maplibregl-canvas-container").exclude(".maplibregl-ctrl-attrib").analyze();
  const check = async (label: string) => {
    const v = (await axe()).violations.map((x) => `${x.id}: ${x.nodes.map((n) => n.target.join(" ")).join(" | ")}`);
    expect(v, `${label}\n${v.join("\n")}`).toEqual([]);
  };
  await page.goto("/fr/voyages");
  await page.getByRole("button", { name: "Donner un avis ou signaler un bug" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await check("feedback dialog");
  await page.keyboard.press("Escape");

  await page.goto("/fr/planifier?from=13055&to=06088");
  await expect(page.locator(".planner__summary")).toContainText("km", { timeout: 20_000 });
  await page.getByRole("button", { name: /Partager/ }).click();
  await expect(page.locator(".share__qr svg")).toBeVisible();
  await check("share dialog");
});

test("every page has a lang attribute, one h1 and a skip link", async ({ page }) => {
  for (const path of ["/fr", "/en/trips", "/fr/accessibilite"]) {
    await page.goto(path);
    await expect(page.locator("html")).toHaveAttribute("lang", path.startsWith("/en") ? "en" : "fr");
    await expect(page.locator("h1")).toHaveCount(1);
    await page.keyboard.press("Tab");
    const skip = page.locator(".skip-links a");
    await expect(skip).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("#main")).toBeFocused();
  }
});

test("reflow: no horizontal scrolling at 320 CSS px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  for (const path of ["/fr", "/fr/planifier?from=13055&to=06088", "/fr/voyages", "/fr/connexion", "/fr/admin", "/fr/profil", "/fr/confidentialite", "/en/about"]) {
    await page.goto(path);
    await page.waitForTimeout(800);
    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(width, path).toBeLessThanOrEqual(320);
  }
});
