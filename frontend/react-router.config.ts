import type { Config } from "@react-router/dev/config";
import { ROUTE_KEYS, ROUTES } from "./app/i18n/paths";

export default {
  appDirectory: "app",
  // Static output served by nginx: every public page is pre-rendered in both
  // languages (SEO), unknown paths fall back to the SPA shell (index.html).
  ssr: false,
  prerender: ROUTE_KEYS.flatMap((key) => [ROUTES[key].fr, ROUTES[key].en]),
} satisfies Config;
