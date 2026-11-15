// Writes build/client/sitemap.xml with hreflang alternates for every indexable page.
// Runs after `react-router build`; Node executes the TypeScript route map natively.
import { writeFileSync } from "node:fs";
import { NOINDEX, ROUTE_KEYS, ROUTES } from "../app/i18n/paths.ts";

const site = (process.env.VITE_SITE_URL ?? "https://tripplanner.mbonnici.fr").replace(/\/$/, "");
const lastmod = new Date().toISOString().slice(0, 10);
const priority = { home: "1.0", planner: "0.9", trips: "0.8", about: "0.6" };

const urls = ROUTE_KEYS.filter((key) => !NOINDEX.has(key)).flatMap((key) =>
  ["fr", "en"].map((lang) => {
    const alternates = ["fr", "en"]
      .map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${site}${ROUTES[key][l]}"/>`)
      .concat(`    <xhtml:link rel="alternate" hreflang="x-default" href="${key === "home" ? `${site}/` : site + ROUTES[key].en}"/>`)
      .join("\n");
    return `  <url>\n    <loc>${site}${ROUTES[key][lang]}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <priority>${priority[key] ?? "0.3"}</priority>\n${alternates}\n  </url>`;
  }),
);

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join("\n")}\n</urlset>\n`;
writeFileSync(new URL("../build/client/sitemap.xml", import.meta.url), xml);
console.log(`sitemap.xml: ${urls.length} URLs`);
