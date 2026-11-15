/** Public facts about the deployment, baked in at build time. */
export const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, "") ?? "https://tripplanner.mbonnici.fr";
export const APP_VERSION = "2.0.0";
export const REPO_URL = "https://github.com/ImMaxence/Epic-Road-Trip-Planner";
export const OWNER = {
  name: "Maxence Bonnici",
  site: "https://mbonnici.fr",
  contact: "https://mbonnici.fr/fr/contact",
  github: "https://github.com/ImMaxence",
};
export const LEGAL_UPDATED = "2026-11-15";
