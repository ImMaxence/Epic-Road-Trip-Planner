import type { Lang } from "../i18n/paths";

const LOCALES: Record<Lang, string> = { fr: "fr-FR", en: "en-GB" };

export function formatKm(km: number | null | undefined, lang: Lang): string {
  if (km == null) return "—";
  const digits = km < 10 ? 1 : 0;
  return `${km.toLocaleString(LOCALES[lang], { maximumFractionDigits: digits })} km`;
}

export function formatDuration(minutes: number | null | undefined, lang: Lang): string {
  if (minutes == null) return "—";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (lang === "fr") return h ? `${h} h ${String(m).padStart(2, "0")}` : `${m} min`;
  return h ? `${h}h ${String(m).padStart(2, "0")}m` : `${m} min`;
}

export function formatDate(iso: string | null | undefined, lang: Lang, style: "long" | "short" = "long"): string {
  if (!iso) return "";
  const date = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  return date.toLocaleDateString(LOCALES[lang], style === "long" ? { day: "numeric", month: "long", year: "numeric" } : { day: "numeric", month: "short" });
}

export function daysBetween(start?: string | null, end?: string | null): number | null {
  if (!start || !end) return null;
  const ms = new Date(`${end}T12:00:00`).getTime() - new Date(`${start}T12:00:00`).getTime();
  return Math.round(ms / 86_400_000) + 1;
}

/** "Saint-Jean-de-Luz" stays readable; very long names get a soft limit for signs. */
export const shortName = (name: string, max = 22) => (name.length > max ? `${name.slice(0, max - 1)}…` : name);

export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function safeHttpUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.href : undefined;
  } catch {
    return undefined;
  }
}
