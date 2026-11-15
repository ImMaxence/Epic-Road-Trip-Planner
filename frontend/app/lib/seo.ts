import type { MetaDescriptor } from "react-router";
import { DICTS } from "../i18n";
import { NOINDEX, langFromPath, path, routeKeyFromPath, type Lang, type RouteKey } from "../i18n/paths";
import { OWNER, REPO_URL, SITE_URL } from "./site";

const OG_LOCALE: Record<Lang, string> = { fr: "fr_FR", en: "en_GB" };

export const absolute = (p: string) => `${SITE_URL}${p}`;

export function organizationLd() {
  return {
    "@type": "Person",
    "@id": `${OWNER.site}/#person`,
    name: OWNER.name,
    url: OWNER.site,
    sameAs: [OWNER.github],
  };
}

export function webAppLd(lang: Lang) {
  const t = DICTS[lang];
  return {
    "@type": "WebApplication",
    "@id": `${SITE_URL}/#app`,
    name: t.brand.name,
    alternateName: "Epic Road Trip Planner",
    url: absolute(path("home", lang)),
    description: t.home.metaDescription,
    applicationCategory: "TravelApplication",
    operatingSystem: "Web",
    inLanguage: ["fr-FR", "en-GB"],
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    areaServed: { "@type": "Country", name: "France" },
    softwareVersion: "2.0.0",
    codeRepository: REPO_URL,
    author: { "@id": `${OWNER.site}/#person` },
    featureList: t.home.features.map((f) => f.title),
  };
}

export function breadcrumbLd(lang: Lang, key: RouteKey, title: string) {
  const home = DICTS[lang].brand.name;
  return {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: home, item: absolute(path("home", lang)) },
      { "@type": "ListItem", position: 2, name: title, item: absolute(path(key, lang)) },
    ],
  };
}

interface SeoInput {
  pathname: string;
  title: string;
  description?: string;
  jsonLd?: object[];
  noindex?: boolean;
}

/** Title, description, canonical, hreflang alternates, Open Graph, Twitter card and JSON-LD. */
export function seo({ pathname, title, description, jsonLd = [], noindex }: SeoInput): MetaDescriptor[] {
  const lang = langFromPath(pathname);
  const key = routeKeyFromPath(pathname);
  const canonical = key ? absolute(path(key, lang)) : absolute(pathname);
  const hidden = noindex || (key ? NOINDEX.has(key) : true);
  const image = absolute(`/og/og-${lang}.png`);
  const meta: MetaDescriptor[] = [
    { title },
    { name: "robots", content: hidden ? "noindex, follow" : "index, follow, max-image-preview:large" },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: "Epic Road Trip" },
    { property: "og:title", content: title },
    { property: "og:url", content: canonical },
    { property: "og:locale", content: OG_LOCALE[lang] },
    { property: "og:locale:alternate", content: OG_LOCALE[lang === "fr" ? "en" : "fr"] },
    { property: "og:image", content: image },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:image:alt", content: DICTS[lang].brand.tagline },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:image", content: image },
  ];
  if (description) {
    meta.push({ name: "description", content: description }, { property: "og:description", content: description }, { name: "twitter:description", content: description });
  }
  if (key && !hidden) {
    meta.push(
      { tagName: "link", rel: "canonical", href: canonical },
      { tagName: "link", rel: "alternate", hrefLang: "fr", href: absolute(path(key, "fr")) },
      { tagName: "link", rel: "alternate", hrefLang: "en", href: absolute(path(key, "en")) },
      { tagName: "link", rel: "alternate", hrefLang: "x-default", href: key === "home" ? `${SITE_URL}/` : absolute(path(key, "en")) },
    );
  }
  if (jsonLd.length) {
    meta.push({ "script:ld+json": { "@context": "https://schema.org", "@graph": jsonLd } });
  }
  return meta;
}
