import { BedDouble, CalendarDays, Fuel, Landmark, Utensils, Wine, type LucideIcon } from "lucide-react";
import type { Category } from "../lib/api";

export const CATEGORY_ICON: Record<Category, LucideIcon> = {
  eat: Utensils,
  drink: Wine,
  sleep: BedDouble,
  enjoy: Landmark,
  travel: Fuel,
  events: CalendarDays,
};

/** Fill colours (white text/icons on top meet WCAG AA). Kept in sync with --cat-* tokens. */
export const CATEGORY_COLOR: Record<Category, string> = {
  eat: "#b8381f",
  drink: "#7d2e6e",
  sleep: "#1f4fa8",
  enjoy: "#6f4325",
  travel: "#0b6b47",
  events: "#8a5a00",
};

/** SVG path data (24×24, stroke) used to paint category glyphs into the map canvas. */
export const CATEGORY_GLYPH: Record<Category, string> = {
  eat: "M7 3v8a2 2 0 0 0 2 2v8M5 3v5a2 2 0 0 0 4 0V3M17 3c-2 0-3 2-3 5s1 4 3 4v9",
  drink: "M8 3h8l-1 7a3 3 0 0 1-6 0zM12 13v7M8 21h8",
  sleep: "M3 18V7M3 13h18v5M21 18v-3a3 3 0 0 0-3-3h-7v1M7 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4",
  enjoy: "M3 21h18M5 21V10M19 21V10M9 21V10M15 21V10M2 10l10-6 10 6z",
  travel: "M4 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M3 21h12M14 9h2a2 2 0 0 1 2 2v5a1.5 1.5 0 0 0 3 0V8l-3-3M7 7h4",
  events: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
};

export function CategoryIcon({ category, size = 18 }: { category: Category; size?: number }) {
  const Icon = CATEGORY_ICON[category];
  return <Icon width={size} height={size} aria-hidden="true" focusable="false" />;
}
