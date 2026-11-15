// Mobile review: screenshots of key screens on an emulated phone + horizontal-overflow check.
//   node mobile-check.mjs <output-dir>
import { chromium, devices } from "@playwright/test";

const out = process.argv[2] ?? "mobile-shots";
const BASE = process.env.BASE_URL ?? "http://localhost:8765";
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const context = await browser.newContext({ ...devices["iPhone 13"], deviceScaleFactor: 1 });
const page = await context.newPage();
const problems = [];
page.on("pageerror", (e) => problems.push(`pageerror: ${e}`));

async function shot(name, path, action, wait = 1500) {
  if (path) await page.goto(BASE + path, { waitUntil: "load" });
  if (action) await action();
  await page.waitForTimeout(wait);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow > 0) problems.push(`${name}: horizontal overflow ${overflow}px`);
  const small = await page.evaluate(() =>
    [...document.querySelectorAll("a, button, [role=button], input, [role=combobox]")]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && (r.width < 24 || r.height < 24) && !el.closest(".visually-hidden, .maplibregl-ctrl-attrib, p, li > a");
      })
      .map((el) => `${el.tagName.toLowerCase()} "${(el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 30)}"`),
  );
  if (small.length) problems.push(`${name}: targets < 24px: ${[...new Set(small)].slice(0, 5).join(", ")}`);
  await page.screenshot({ path: `${out}/${name}.png` });
}

await shot("01-home", "/fr");
await shot("02-home-form", null, () => page.evaluate(() => window.scrollTo(0, 480)));
await shot("03-menu", null, async () => {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.getByRole("button", { name: "Ouvrir le menu" }).click();
});
await shot("04-planner", "/fr/planifier?from=13055&to=06088&via=13001.83119&start=2026-07-10&end=2026-07-17", null, 8000);
await shot("05-planner-explore", null, () => page.locator("#explore-title").scrollIntoViewIfNeeded(), 2500);
await shot("06-trips", "/fr/voyages", null, 2000);
await shot("07-login", "/fr/connexion");
await shot("08-guest-profile", null, async () => {
  await page.getByRole("button", { name: "Essayer en mode invité" }).click();
  await page.waitForURL(/\/fr\/profil$/);
}, 2000);
await shot("09-legal", "/fr/confidentialite");
await shot("10-en-home-dark", null, async () => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto(BASE + "/en", { waitUntil: "load" });
});
await page.request.post(BASE + "/api/auth/logout", { headers: { Origin: BASE } });
console.log(problems.length ? problems.join("\n") : "no problems detected");
await browser.close();
