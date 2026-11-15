import { index, route, type RouteConfig } from "@react-router/dev/routes";
import { LANGS, ROUTE_KEYS, ROUTES } from "./i18n/paths";

// Each page module serves both languages; the language is read from the URL.
export default [
  index("routes/language-redirect.tsx"),
  ...ROUTE_KEYS.flatMap((key) =>
    LANGS.map((lang) => route(ROUTES[key][lang], `routes/${key}.tsx`, { id: `${key}-${lang}` })),
  ),
  route("*", "routes/not-found.tsx"),
] satisfies RouteConfig;
