import type { Dict } from "../i18n";
import { ApiError } from "./api";

/** Same-site localised paths only (mirrors the server-side check). */
export function safeNext(next: string | null): string | null {
  return next && /^\/(fr|en)(\/|$)/.test(next) && !next.startsWith("//") && !next.includes("\\") ? next : null;
}

/** Localised message for an API error code. */
export const apiErrorText = (t: Dict, e: unknown) => (e instanceof ApiError ? (t.auth.errors[e.code] ?? t.auth.errors.generic) : t.auth.errors.generic);
