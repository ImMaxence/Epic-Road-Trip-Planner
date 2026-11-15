// Lighthouse audit of key pages (mobile preset + desktop home).
//   node lighthouse.mjs [output-dir]
import { chromium } from "@playwright/test";
import lighthouse from "lighthouse";
import desktopConfig from "lighthouse/core/config/desktop-config.js";
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:8765";
const out = process.argv[2] ?? "lighthouse-reports";
mkdirSync(out, { recursive: true });

const runs = [
  { name: "home-mobile", path: "/fr" },
  { name: "planner-mobile", path: "/fr/planifier?from=13055&to=06088&via=13001" },
  { name: "trips-mobile", path: "/en/trips" },
  { name: "legal-mobile", path: "/fr/mentions-legales" },
  { name: "home-desktop", path: "/en", desktop: true },
];

const PORT = 9333;
const browser = await chromium.launch({ args: [`--remote-debugging-port=${PORT}`] });
const rows = [];
for (const run of runs) {
  const result = await lighthouse(BASE + run.path, { port: PORT, output: "html", logLevel: "error" }, run.desktop ? desktopConfig : undefined);
  const lhr = result.lhr;
  writeFileSync(`${out}/${run.name}.html`, result.report);
  const score = (k) => Math.round((lhr.categories[k]?.score ?? 0) * 100);
  const failing = Object.values(lhr.audits)
    .filter((a) => a.score !== null && a.score < 0.9 && a.scoreDisplayMode !== "informative" && a.scoreDisplayMode !== "notApplicable" && a.scoreDisplayMode !== "manual")
    .map((a) => `${a.id}${a.displayValue ? ` (${a.displayValue})` : ""}`);
  rows.push({
    page: run.name,
    performance: score("performance"),
    accessibility: score("accessibility"),
    bestPractices: score("best-practices"),
    seo: score("seo"),
    LCP: lhr.audits["largest-contentful-paint"].displayValue,
    CLS: lhr.audits["cumulative-layout-shift"].displayValue,
    TBT: lhr.audits["total-blocking-time"].displayValue,
    issues: failing.slice(0, 8).join(", "),
  });
}
await browser.close();
console.table(rows.map(({ issues, ...r }) => r));
for (const r of rows) console.log(`${r.page}: ${r.issues || "—"}`);
