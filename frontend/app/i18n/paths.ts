/** Localised URL slugs. Shared by the router, the prerender list and the sitemap. */
export const LANGS = ["fr", "en"] as const;
export type Lang = (typeof LANGS)[number];

export const ROUTES = {
  home: { fr: "/fr", en: "/en" },
  planner: { fr: "/fr/planifier", en: "/en/plan" },
  trips: { fr: "/fr/voyages", en: "/en/trips" },
  about: { fr: "/fr/a-propos", en: "/en/about" },
  login: { fr: "/fr/connexion", en: "/en/login" },
  admin: { fr: "/fr/admin", en: "/en/admin" },
  profile: { fr: "/fr/profil", en: "/en/profile" },
  legal: { fr: "/fr/mentions-legales", en: "/en/legal-notice" },
  privacy: { fr: "/fr/confidentialite", en: "/en/privacy" },
  terms: { fr: "/fr/conditions-utilisation", en: "/en/terms" },
  accessibility: { fr: "/fr/accessibilite", en: "/en/accessibility" },
  sitemap: { fr: "/fr/plan-du-site", en: "/en/sitemap" },
} as const satisfies Record<string, Record<Lang, string>>;

export type RouteKey = keyof typeof ROUTES;
export const ROUTE_KEYS = Object.keys(ROUTES) as RouteKey[];

/** Pages kept out of search engines (personal device space, administration). */
export const NOINDEX: ReadonlySet<RouteKey> = new Set<RouteKey>(["login", "profile", "admin"]);

export function langFromPath(pathname: string): Lang {
  return pathname === "/en" || pathname.startsWith("/en/") ? "en" : "fr";
}

export function routeKeyFromPath(pathname: string): RouteKey | undefined {
  const clean = pathname.replace(/\/+$/, "") || "/";
  return ROUTE_KEYS.find((key) => ROUTES[key].fr === clean || ROUTES[key].en === clean);
}

export const path = (key: RouteKey, lang: Lang) => ROUTES[key][lang];
