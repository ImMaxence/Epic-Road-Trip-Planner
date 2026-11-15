import { expect, test, type Page } from "@playwright/test";

async function pickPlace(page: Page, label: string | RegExp, query: string, option: string, keepsValue = true) {
  const input = page.getByRole("combobox", { name: label });
  await input.click();
  await input.fill(query);
  const choice = page.getByRole("option", { name: new RegExp(`^${option}\\b`) }).first();
  await expect(choice).toBeVisible();
  // Move the keyboard highlight until the expected commune is active, as a user would, then confirm.
  const wanted = new RegExp(`^${option}\\s*\\(`);
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("ArrowDown");
    const active = await input.getAttribute("aria-activedescendant");
    const text = active ? await page.locator(`[id="${active}"]`).innerText() : "";
    if (wanted.test(text.trim())) break;
  }
  await page.keyboard.press("Enter");
  if (keepsValue) await expect(input).toHaveValue(option);
}

test("bare domain redirects according to Accept-Language", async ({ request }) => {
  const fr = await request.get("/", { headers: { "Accept-Language": "fr-FR,fr;q=0.9" }, maxRedirects: 0 });
  expect(fr.status()).toBe(302);
  expect(fr.headers().location).toBe("/fr");
  const en = await request.get("/", { headers: { "Accept-Language": "en-GB" }, maxRedirects: 0 });
  expect(en.headers().location).toBe("/en");
});

test("unknown pages answer 404 with the road-closed page", async ({ page }) => {
  const response = await page.goto("/fr/nulle-part");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("n'existe pas");
});

test("SEO essentials are served", async ({ request, page }) => {
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("<loc>");
  expect(sitemap).toContain('hreflang="en"');
  expect(await (await request.get("/robots.txt")).text()).toContain("Sitemap:");
  expect((await request.get("/llms.txt")).ok()).toBe(true);
  await page.goto("/en/trips");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/en\/trips$/);
  await expect(page.locator('link[rel="alternate"][hreflang="fr"]')).toHaveAttribute("href", /\/fr\/voyages$/);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /.{50,}/);
});

test("language switcher keeps the page", async ({ page }) => {
  await page.goto("/fr/voyages");
  await page.getByRole("link", { name: "Read this page in English" }).first().click();
  await expect(page).toHaveURL(/\/en\/trips$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("home form drives the planner with the keyboard", async ({ page }) => {
  await page.goto("/fr");
  await page.getByRole("button", { name: /Tracer la route/ }).click();
  await expect(page.getByText("Choisissez une commune de départ").first()).toBeVisible();
  await pickPlace(page, /^Départ/, "marse", "Marseille");
  await pickPlace(page, /^Arrivée/, "nice", "Nice");
  await page.getByRole("button", { name: /Tracer la route/ }).click();
  await expect(page).toHaveURL(/\/fr\/planifier\?from=13055&to=06088/);
  await expect(page.getByRole("status").filter({ hasText: "Itinéraire calculé" })).toHaveCount(1, { timeout: 20_000 });
  await expect(page.locator(".planner__summary")).toContainText("km");
});

test("planner: travel mode changes the route", async ({ page }) => {
  await page.goto("/fr/planifier?from=13055&to=13001");
  const summary = page.locator(".planner__summary");
  await expect(summary).toContainText("km", { timeout: 20_000 });
  const carTime = await summary.locator("div").nth(1).locator("dd").innerText();
  await page.locator(".travel-mode .radio", { hasText: "Vélo" }).click();
  await expect(page).toHaveURL(/mode=bike/);
  await expect(summary.locator("div").nth(1).locator("dd")).not.toHaveText(carTime, { timeout: 20_000 });
});

test("planner: add, reorder and remove stops; explore places", async ({ page }) => {
  await page.goto("/fr/planifier?from=13055&to=06088");
  await page.getByRole("button", { name: "Ajouter une étape" }).click();
  await pickPlace(page, "Nouvelle étape", "aix-en", "Aix-en-Provence", false);
  await expect(page).toHaveURL(/via=13001/);
  await page.getByRole("button", { name: "Ajouter une étape" }).click();
  await pickPlace(page, "Nouvelle étape", "toulon", "Toulon", false);
  await expect(page).toHaveURL(/via=13001\.83137/);
  await page.getByRole("button", { name: "Monter Toulon" }).click();
  await expect(page).toHaveURL(/via=83137\.13001/);
  await page.getByRole("button", { name: "Retirer l'étape Aix-en-Provence" }).click();
  await expect(page).toHaveURL(/via=83137(&|$)/);

  await expect(page.locator(".explorer__status")).toContainText("lieux trouvés", { timeout: 20_000 });
  // One category at a time: the list only shows that category.
  await page.getByRole("radio", { name: /^Dormir/ }).click();
  await expect(page.getByRole("radio", { name: /^Dormir/ })).toHaveAttribute("aria-checked", "true");
  await expect(page.locator(".poi-group")).toHaveCount(0);
  await expect(page.locator(".poi .poi__meta").first()).toContainText(/Hôtel|Camping|Chambre|Auberge|Gîte|Motel|Location|Refuge|Aire/);
  await page.getByRole("radio", { name: /^Tout/ }).click();
  await expect(page.locator(".poi-group").first()).toBeVisible();
  await expect(page.locator(".explorer__freshness")).toContainText("mis à jour le");
  const firstPin = page.locator(".poi .pin-toggle").first();
  await firstPin.click();
  await expect(firstPin).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".notebook li li")).toHaveCount(1);
});

test("no visitor accounts; administration is reserved to Google administrators", async ({ page }) => {
  expect((await page.request.post("/api/auth/register", { data: { email: "a@b.fr", password: "x" } })).status()).toBe(404);
  expect((await page.request.post("/api/auth/guest", { data: {} })).status()).toBe(404);
  expect((await page.request.get("/api/admin/stats")).status()).toBe(401);
  await page.goto("/fr");
  await expect(page.getByRole("link", { name: "Connexion", exact: true })).toHaveCount(0);
  await page.goto("/fr/admin");
  await expect(page.getByText("Cette page est réservée aux administrateurs")).toBeVisible();
  await page.goto("/fr/connexion?error=not_admin");
  await expect(page.getByRole("alert")).toContainText("ne figure pas parmi les administrateurs");
  const res = await page.request.get("/api/auth/google/start?lang=en", { maxRedirects: 0 });
  expect(res.status()).toBe(303);
});

test("feedback dialog offers a pre-filled GitHub issue and an e-mail", async ({ page }) => {
  await page.goto("/en/trips");
  await page.getByRole("button", { name: "Give feedback or report a bug" }).click();
  const dialog = page.getByRole("dialog", { name: "Feedback or a bug?" });
  const issue = dialog.getByRole("link", { name: /Open a GitHub issue/ });
  const href = (await issue.getAttribute("href")) ?? "";
  expect(href).toContain("https://github.com/ImMaxence/Epic-Road-Trip-Planner/issues/new?");
  expect(decodeURIComponent(href.replace(/\+/g, " "))).toContain("/en/trips");
  const config = await (await page.request.get("/api/config")).json();
  if (config.feedbackMailbox) {
    // The address is never written in the page; it is rebuilt on demand.
    expect(await page.content()).not.toMatch(/[w.+-]+@[w-]+.[w.]+/);
    await expect(dialog.getByRole("button", { name: "Send an email" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Copy the email address" })).toBeVisible();
  }
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});

test("installable PWA: manifest, service worker and offline page", async ({ page, request }) => {
  const manifest = await (await request.get("/manifest-en.webmanifest")).json();
  expect(manifest).toMatchObject({ id: "/", start_url: "/en", display: "standalone" });
  for (const shot of manifest.screenshots) expect((await request.get(shot.src)).ok(), shot.src).toBe(true);
  const sw = await request.get("/sw.js");
  expect(sw.headers()["cache-control"]).toContain("no-cache");
  expect((await request.get("/offline.html")).ok()).toBe(true);

  await page.goto("/en");
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href", "/manifest-en.webmanifest");
  const scope = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope);
  expect(scope).toMatch(/\/$/);
  // Offline: a visited page comes from the cache, an unknown one gets the offline page.
  await page.reload();
  await page.context().setOffline(true);
  await page.goto("/en");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.goto("/en/legal-notice");
  await expect(page.getByRole("heading", { name: "Vous êtes hors ligne" })).toBeVisible();
  await page.context().setOffline(false);
});

test("without an account: trips and favourites are saved on this device", async ({ page }) => {
  const serverTrips = async () => (await (await page.request.get("/api/trips?featured=false")).json()).total as number;
  const before = await serverTrips();
  await page.goto("/en/plan?from=74281&to=06083&via=05023");
  await expect(page.locator(".planner__summary")).toContainText("km", { timeout: 20_000 });
  await page.getByRole("button", { name: /Save/ }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("saved in this browser, on this device only")).toBeVisible();
  await dialog.getByLabel("Trip name").fill("My device trip");
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Trip saved on this device" })).toBeVisible();
  await expect(page).toHaveURL(/local=local-[a-z0-9]+/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("My device trip");
  await expect(page.getByRole("button", { name: /Update/ })).toBeVisible();

  await page.goto("/en/trips");
  const fav = page.locator(".ticket").filter({ hasText: "Loire" }).getByRole("button", { name: /favourites/ });
  await fav.click();
  await expect(fav).toHaveAttribute("aria-pressed", "true");

  await page.goto("/en/profile");
  await expect(page.locator("section[aria-labelledby=local-trips-title] .ticket")).toHaveCount(1);
  await expect(page.locator("section[aria-labelledby=local-favorites-title] .ticket")).toHaveCount(1);
  await page.locator("section[aria-labelledby=local-trips-title] .ticket").getByRole("link").click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("My device trip");

  // Nothing reached the server.
  expect(await serverTrips()).toBe(before);
  page.once("dialog", (d) => void d.accept());
  await page.goto("/en/profile");
  await page.getByRole("button", { name: "Clear this device's data" }).click();
  await expect(page.getByText("No trip saved on this device")).toBeVisible();
});

test("share link carries the pinned places, with a QR code to open it on a phone", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/fr/planifier?from=13055&to=06088&mode=bike");
  await expect(page.locator(".explorer__status")).toContainText("lieux trouvés", { timeout: 20_000 });
  await page.locator(".poi .pin-toggle").nth(0).click();
  await page.locator(".poi .pin-toggle").nth(1).click();
  await page.getByRole("button", { name: /Partager/ }).click();
  const dialog = page.getByRole("dialog", { name: "Partager ce voyage" });
  await expect(dialog.getByText("les 2 lieux épinglés")).toBeVisible();
  await expect(dialog.getByRole("img", { name: "QR code du lien de partage" }).locator("svg")).toBeVisible();
  const url = await dialog.getByRole("textbox", { name: "Lien de partage" }).inputValue();
  expect(url).toMatch(/\/fr\/planifier\?from=13055&to=06088&mode=bike&p=[A-Za-z0-9_-]+$/);
  await dialog.getByRole("button", { name: "Copier le lien" }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(url);

  // Someone else opens the link: same route, same pins, and the long parameter leaves the address bar.
  const other = await context.browser()!.newPage();
  await other.goto(url);
  await expect(other.locator(".notebook li li")).toHaveCount(2, { timeout: 20_000 });
  await expect(other).toHaveURL(/mode=bike$/);
  await other.close();
});

test("device data moves between browsers with an export file", async ({ page, browser }, testInfo) => {
  await page.goto("/en/plan?from=74281&to=06083");
  await expect(page.locator(".planner__summary")).toContainText("km", { timeout: 20_000 });
  await page.getByRole("button", { name: /Save/ }).click();
  await page.getByRole("dialog").getByLabel("Trip name").fill("Alps to sea");
  await page.getByRole("dialog").getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Trip saved on this device" })).toBeVisible();
  await page.goto("/en/profile");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export (JSON file)" }).click();
  const file = testInfo.outputPath("export.json");
  await (await download).saveAs(file);

  const fresh = await browser.newPage();
  await fresh.goto("/en/profile");
  await expect(fresh.getByText("No trip saved on this device")).toBeVisible();
  await fresh.locator("input[type=file]").setInputFiles(file);
  await expect(fresh.getByRole("status").filter({ hasText: "Import complete: 1 trip" })).toBeVisible();
  await expect(fresh.locator("section[aria-labelledby=local-trips-title] .ticket")).toContainText("Alps to sea");
  await fresh.close();
});
