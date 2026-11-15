import { useLocation } from "react-router";
import { en } from "./en";
import { fr, type Dict } from "./fr";
import { langFromPath, path, routeKeyFromPath, type Lang, type RouteKey } from "./paths";

export { LANGS, ROUTES, langFromPath, path, routeKeyFromPath, type Lang, type RouteKey } from "./paths";
export type { Dict } from "./fr";

export const DICTS: Record<Lang, Dict> = { fr, en };

export function useLang(): Lang {
  return langFromPath(useLocation().pathname);
}

export function useT(): Dict {
  return DICTS[useLang()];
}

/** Localised link helper bound to the current language. */
export function useHref(): (key: RouteKey) => string {
  const lang = useLang();
  return (key) => path(key, lang);
}

/** Same page in the other language, keeping the query string (used by the language switcher). */
export function alternatePath(pathname: string, search: string, target: Lang): string {
  const key = routeKeyFromPath(pathname);
  return key ? path(key, target) + search : path("home", target);
}
