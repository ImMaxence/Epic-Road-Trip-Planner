// Generates README screenshots (doc/screenshots), PWA screenshots (frontend/public/screenshots, PNG,
// converted to WebP afterwards) and Open Graph cards (frontend/public/og) from a running local stack:
//   node screenshots.mjs
// The administration view uses a session signed locally with the .env secret for a demo admin
// (ADMIN_EMAILS must contain admin@example.org in the local .env); it cannot work against production.
import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { SessionSigner } from "../backend/src/lib/session.ts";

const BASE = process.env.BASE_URL ?? "http://localhost:8765";
const SHOTS = new URL("../doc/screenshots/", import.meta.url);
const OG = new URL("../frontend/public/og/", import.meta.url);
const PWA = new URL("../frontend/public/screenshots/", import.meta.url);
for (const dir of [SHOTS, OG, PWA]) mkdirSync(dir, { recursive: true });
const shot = (name, dir = SHOTS) => fileURLToPath(new URL(name, dir));
const env = Object.fromEntries(
  readFileSync(new URL("../.env", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((l) => /^[A-Z0-9_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);

const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });

async function open(path, { width = 1440, height = 900, dark = false, scale = 1 } = {}) {
  const page = await browser.newPage({ viewport: { width, height }, colorScheme: dark ? "dark" : "light", deviceScaleFactor: scale });
  await page.goto(BASE + path, { waitUntil: "load" });
  return page;
}

const PROVENCE = "/en/plan?from=13055&to=06088&via=13001.83119&start=2026-07-10&end=2026-07-17";

// Home hero
{
  const page = await open("/en");
  await page.waitForTimeout(2500);
  await page.screenshot({ path: fileURLToPath(new URL("home.png", SHOTS)) });
  await page.close();
}

// Planner: places around Marseille, a restaurant focused on the Atlas map
{
  const page = await open(PROVENCE);
  await page.waitForTimeout(5000);
  await page.locator("#explore-title").scrollIntoViewIfNeeded();
  // Pin two places: they get a gold halo on the map and join the road book.
  await page.locator(".poi .pin-toggle").nth(0).click();
  await page.locator(".poi .pin-toggle").nth(3).click();
  await page.getByRole("button", { name: /Show on map/ }).nth(1).click();
  await page.waitForTimeout(9000);
  await page.screenshot({ path: shot("planner.png") });
  await page.screenshot({ path: shot("planner-wide.png", PWA) });
  await page.close();
}

// Mobile
{
  const page = await open(PROVENCE, { width: 390, height: 844, scale: 2 });
  await page.waitForTimeout(9000);
  await page.screenshot({ path: shot("mobile.png") });
  await page.screenshot({ path: shot("planner-narrow.png", PWA) });
  await page.close();
}

// By bike along the Loire: the cycling network and bike travel times
{
  const page = await open("/en/plan?from=37261&to=41018&via=37003&mode=bike&color=green");
  await page.waitForTimeout(9000);
  await page.screenshot({ path: shot("bike.png") });
  await page.close();
}

// Night theme on the Provence classic
{
  const page = await open("/en/plan?from=84007&to=06088&via=84050.13001.13055.13022.83119&style=night&color=yellow", { dark: true });
  await page.waitForTimeout(10000);
  await page.screenshot({ path: fileURLToPath(new URL("night.png", SHOTS)) });
  await page.close();
}

// Shared trips gallery
{
  const page = await open("/en/trips");
  await page.waitForTimeout(2500);
  await page.evaluate(() => window.scrollTo(0, 330));
  await page.waitForTimeout(500);
  await page.screenshot({ path: shot("trips.png") });
  await page.close();
}

// Share dialog: the link carries the pinned places, with a QR code to open it on a phone
{
  const page = await open(PROVENCE);
  await page.waitForTimeout(5000);
  await page.locator("#explore-title").scrollIntoViewIfNeeded();
  await page.locator(".poi .pin-toggle").nth(0).click();
  await page.locator(".poi .pin-toggle").nth(2).click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.getByRole("button", { name: /^Share/ }).click();
  await page.locator(".share__qr svg").waitFor();
  await page.waitForTimeout(800);
  await page.screenshot({ path: shot("share.png") });
  await page.close();
}

// Feedback dialog
{
  const page = await open("/en/trips");
  await page.waitForTimeout(1500);
  await page.getByRole("button", { name: "Give feedback or report a bug" }).click();
  await page.waitForTimeout(700);
  await page.screenshot({ path: shot("feedback.png") });
  await page.close();
}

// Administration: curating the gallery, with a locally signed demo admin session
{
  const sql =
    "INSERT INTO users (email, username, google_sub, locale) VALUES ('admin@example.org', 'Maxence', 'demo-admin', 'en') " +
    "ON DUPLICATE KEY UPDATE google_sub = 'demo-admin'; SELECT id, token_version FROM users WHERE email = 'admin@example.org';";
  const out = execFileSync("docker", ["exec", "epic-road-trip-planner-db-1", "mariadb", "-uroot", `-p${env.SERVICE_PASSWORD_MARIADBROOT}`, "-N", "roadtrip", "-e", sql]).toString().trim();
  const [id, version] = out.split(/\s+/).map(Number);
  const token = await new SessionSigner(env.SERVICE_PASSWORD_64_JWT).sign({ userId: id, version });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  await ctx.addCookies([{ name: "ert_session", value: token, url: BASE, httpOnly: true, sameSite: "Lax" }]);
  // Two trips of the admin's own: one published, one private.
  const featured = (await (await ctx.request.get(`${BASE}/api/trips?featured=true&limit=6`)).json()).items;
  const mine = (await (await ctx.request.get(`${BASE}/api/me/trips`)).json()).items;
  if (!mine.length) {
    for (const [i, sample] of featured.slice(0, 2).entries()) {
      const detail = (await (await ctx.request.get(`${BASE}/api/trips/${sample.id}`)).json()).trip;
      await ctx.request.post(`${BASE}/api/trips`, {
        headers: { Origin: BASE },
        data: { title: `${detail.titles?.en ?? detail.title} — my version`.slice(0, 80), cover: detail.cover, isPublic: i === 0, plan: { ...detail.plan, titles: undefined, summary: undefined } },
      });
    }
  }
  const page = await ctx.newPage();
  await page.goto(`${BASE}/en/admin`);
  await page.locator(".admin-table").first().waitFor();
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.scrollTo(0, 120));
  await page.waitForTimeout(400);
  await page.screenshot({ path: shot("admin.png") });
  // Map data panel: freshness of each source and the manual "Update now" button.
  await page.locator("#admin-data-title").scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, 260));
  await page.waitForTimeout(500);
  await page.screenshot({ path: shot("admin-data.png") });
  await ctx.close();
}

// iPhone: install help (iOS has no install prompt, the steps go through the share menu)
{
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1",
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/en/profile`);
  await page.getByRole("button", { name: "Install the app" }).first().click();
  await page.locator(".install-steps").waitFor();
  await page.waitForTimeout(600);
  await page.screenshot({ path: shot("install-ios.png") });
  await ctx.close();
}

// Showcase: desktop + phone on the brand's paper, for the top of the README
{
  const b64 = (name) => `data:image/png;base64,${readFileSync(shot(name)).toString("base64")}`;
  const page = await open("/en", { width: 1600, height: 900 });
  await page.waitForTimeout(1200);
  await page.evaluate(({ desktop, phone }) => {
    document.body.innerHTML = `
      <div style="position:fixed;inset:0;overflow:hidden;background:var(--paper);display:grid;grid-template-columns:500px 1fr;gap:28px;padding:64px 0 0 70px">
        <div style="position:absolute;left:0;right:0;bottom:0;height:120px;background:#23272f"></div>
        <div style="position:absolute;left:0;right:0;bottom:56px;height:8px;background:repeating-linear-gradient(90deg,#f1ebdd 0 60px,transparent 60px 110px)"></div>
        <div style="position:relative;z-index:1">
          <div style="display:flex;align-items:center;gap:14px;margin-bottom:34px">
            <svg width="40" height="52" viewBox="0 0 40 52"><path d="M5 51V19a15 15 0 0 1 30 0v32Z" fill="#fffaf0" stroke="#1d2433" stroke-width="2.5"/><path d="M6.25 21v-2a13.75 13.75 0 0 1 27.5 0v2Z" fill="#c0311d"/><path d="M5 21h30" stroke="#1d2433" stroke-width="1.5"/><path d="M13 31h14M15 38h10" stroke="#1d2433" stroke-width="2.5" stroke-linecap="round"/></svg>
            <span style="font-family:var(--font-display);font-weight:800;font-size:34px;text-transform:uppercase;color:#1d2433">Epic Road <span style="color:#c0311d">Trip</span></span>
          </div>
          <div style="font-family:var(--font-display);font-weight:800;font-size:92px;line-height:.88;text-transform:uppercase;color:#1d2433">France,</div>
          <div style="font-family:var(--font-serif);font-style:italic;font-size:64px;line-height:1.05;color:#c0311d">one milestone at a time.</div>
          <p style="margin:24px 0 26px;font-size:22px;line-height:1.45;color:#434c5e;max-width:28ch">The free road trip planner: real routes, places at every stop, a road book you can print or take offline.</p>
          <div style="display:flex;flex-wrap:wrap;gap:10px;max-width:440px">
            ${["Car · Bike · On foot", "6 kinds of places", "Printable road book", "Installable app", "FR / EN", "No ads, no tracking"]
              .map((c, i) => `<span style="padding:8px 14px;border-radius:999px;border:2px solid #1d2433;font-family:var(--font-display);font-weight:700;font-size:19px;letter-spacing:.04em;text-transform:uppercase;background:${["#c0311d", "#1f4fa8", "#0b6b47", "#f2b705", "#fbf8f1", "#fbf8f1"][i]};color:${i < 3 ? "#fff" : "#1d2433"}">${c}</span>`)
              .join("")}
          </div>
        </div>
        <div style="position:relative;z-index:1">
          <div style="position:absolute;left:40px;top:0;width:980px;border-radius:14px;overflow:hidden;border:2px solid #1d2433;box-shadow:0 30px 70px rgb(29 36 51 / .28);background:#fbf8f1">
            <div style="display:flex;align-items:center;gap:8px;height:38px;padding:0 14px;background:#ebe2cf;border-bottom:2px solid #1d2433">
              <i style="width:12px;height:12px;border-radius:50%;background:#c0311d"></i><i style="width:12px;height:12px;border-radius:50%;background:#f2b705"></i><i style="width:12px;height:12px;border-radius:50%;background:#0b6b47"></i>
              <span style="margin-left:14px;padding:3px 14px;border-radius:999px;background:#fbf8f1;font:600 14px system-ui;color:#434c5e">tripplanner.mbonnici.fr/en/plan</span>
            </div>
            <img src="${desktop}" style="display:block;width:100%">
          </div>
          <div style="position:absolute;left:-20px;top:250px;width:262px;padding:10px;border-radius:40px;background:#1d2433;box-shadow:0 30px 60px rgb(29 36 51 / .4)">
            <img src="${phone}" style="display:block;width:100%;border-radius:30px">
          </div>
        </div>
      </div>`;
  }, { desktop: b64("planner.png"), phone: b64("mobile.png") });
  await page.waitForTimeout(800);
  await page.screenshot({ path: shot("showcase.png") });
  await page.close();
}

// Open Graph cards, composed with the site's own components and fonts
for (const lang of ["fr", "en"]) {
  const page = await open(`/${lang}`, { width: 1200, height: 630 });
  await page.waitForTimeout(1500);
  const copy =
    lang === "fr"
      ? { top: "La France,", bottom: "borne après borne.", lead: "Planificateur de road trips gratuit · itinéraire routier · lieux à chaque étape · carnet imprimable", signs: [["Menton", "673"], ["Angers", "308"], ["Nice", "396"]] }
      : { top: "France,", bottom: "one milestone at a time.", lead: "Free road trip planner · real driving routes · places at every stop · printable road book", signs: [["Menton", "673"], ["Angers", "308"], ["Nice", "396"]] };
  await page.evaluate((c) => {
    document.body.innerHTML = `
      <div style="position:fixed;inset:0;background:var(--paper);display:grid;grid-template-columns:1.25fr .85fr;gap:40px;padding:64px 72px;align-items:center">
        <div>
          <div style="display:flex;align-items:center;gap:14px;margin-bottom:28px">
            <svg width="40" height="52" viewBox="0 0 40 52"><path d="M5 51V19a15 15 0 0 1 30 0v32Z" fill="#fffaf0" stroke="#1d2433" stroke-width="2.5"/><path d="M6.25 21v-2a13.75 13.75 0 0 1 27.5 0v2Z" fill="#c0311d"/><path d="M5 21h30" stroke="#1d2433" stroke-width="1.5"/><path d="M13 31h14M15 38h10" stroke="#1d2433" stroke-width="2.5" stroke-linecap="round"/></svg>
            <span style="font-family:var(--font-display);font-weight:800;font-size:34px;text-transform:uppercase;color:#1d2433">Epic Road <span style="color:#c0311d">Trip</span></span>
          </div>
          <div style="font-family:var(--font-display);font-weight:800;font-size:104px;line-height:.88;text-transform:uppercase;color:#1d2433">${c.top}</div>
          <div style="font-family:var(--font-serif);font-style:italic;font-size:76px;line-height:1.05;color:#c0311d">${c.bottom}</div>
          <p style="margin-top:26px;font-size:24px;line-height:1.4;color:#434c5e;max-width:30ch">${c.lead}</p>
          <p style="margin-top:18px;font-family:var(--font-display);font-weight:700;font-size:24px;letter-spacing:.06em;color:#1d2433">TRIPPLANNER.MBONNICI.FR</p>
        </div>
        <div style="position:relative;display:grid;gap:16px;justify-items:center">
          <div style="position:absolute;top:-20px;bottom:-80px;left:50%;width:14px;transform:translateX(-50%);border-radius:7px 7px 0 0;background:linear-gradient(90deg,#6d7480,#c9ced6 45%,#8a919c)"></div>
          ${c.signs.map(([n, k], i) => `<span class="arrow-sign ${["", "arrow-sign--blue arrow-sign--left", "arrow-sign--brown"][i]}" style="animation:none;width:320px;position:relative"><span class="arrow-sign__name">${n}</span> <span class="arrow-sign__km">${k}</span></span>`).join("")}
        </div>
      </div>`;
  }, copy);
  await page.waitForTimeout(400);
  await page.screenshot({ path: fileURLToPath(new URL(`og-${lang}.png`, OG)) });
  await page.close();
}

await browser.close();
console.log("screenshots and OG cards generated");
