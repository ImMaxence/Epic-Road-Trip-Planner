import type { MapStyle } from "../../lib/api";

/** OpenFreeMap styles, fetched through our own /tiles proxy (no third-party request from the browser). */
const SOURCE_STYLE: Record<MapStyle, string> = {
  atlas: "positron",
  day: "liberty",
  night: "dark",
};

const OFM = "https://tiles.openfreemap.org/";

export function proxiedUrl(url: string): string {
  return url.startsWith(OFM) ? `${window.location.origin}/tiles/${url.slice(OFM.length)}` : url;
}

// "Atlas" palette: a nod to French paper road atlases — red motorways, yellow trunk roads, cream paper.
const ATLAS = {
  paper: "#f1e8d5",
  water: "#b4c7d4",
  waterLine: "#93adc0",
  green: "#d5dcb8",
  wood: "#c9d3a8",
  residential: "#eadfc8",
  building: "#dccfb4",
  motorway: "#d8432c",
  motorwayCasing: "#7a2414",
  major: "#f2bf3c",
  majorCasing: "#8f6a1c",
  minor: "#fffaf0",
  rail: "#7a6f5f",
  boundary: "#7d2e6e",
  ink: "#1d2433",
  inkSoft: "#4a5266",
};

type Layer = { id: string; type: string; paint?: Record<string, unknown>; layout?: Record<string, unknown> };
type StyleJson = { layers: Layer[]; [key: string]: unknown };

function atlasify(style: StyleJson): StyleJson {
  for (const layer of style.layers) {
    const id = layer.id;
    const paint = (layer.paint ??= {});
    if (layer.type === "background") paint["background-color"] = ATLAS.paper;
    else if (layer.type === "fill") {
      if (id.startsWith("water")) paint["fill-color"] = ATLAS.water;
      else if (id === "park") paint["fill-color"] = ATLAS.green;
      else if (id.includes("wood")) paint["fill-color"] = ATLAS.wood;
      else if (id.includes("residential")) paint["fill-color"] = ATLAS.residential;
      else if (id === "building") paint["fill-color"] = ATLAS.building;
    } else if (layer.type === "line") {
      if (id.startsWith("waterway")) paint["line-color"] = ATLAS.waterLine;
      else if (id.includes("motorway")) paint["line-color"] = id.includes("casing") ? ATLAS.motorwayCasing : ATLAS.motorway;
      else if (id.includes("major")) paint["line-color"] = id.includes("casing") ? ATLAS.majorCasing : ATLAS.major;
      else if (id.includes("minor") || id.includes("path")) paint["line-color"] = ATLAS.minor;
      else if (id.startsWith("railway")) paint["line-color"] = ATLAS.rail;
      else if (id.startsWith("boundary")) paint["line-color"] = ATLAS.boundary;
    } else if (layer.type === "symbol") {
      paint["text-color"] = id.includes("water") ? "#3d5a73" : id.includes("city") || id.includes("country") ? ATLAS.ink : ATLAS.inkSoft;
      paint["text-halo-color"] = ATLAS.paper;
      paint["text-halo-width"] = 1.4;
    }
  }
  return style;
}

const cache = new Map<MapStyle, Promise<StyleJson>>();

export function loadStyle(style: MapStyle): Promise<StyleJson> {
  let pending = cache.get(style);
  if (!pending) {
    pending = fetch(`${window.location.origin}/tiles/styles/${SOURCE_STYLE[style]}`)
      .then((r) => {
        if (!r.ok) throw new Error(`style ${r.status}`);
        return r.json() as Promise<StyleJson>;
      })
      .then((json) => (style === "atlas" ? atlasify(json) : json));
    pending.catch(() => cache.delete(style));
    cache.set(style, pending);
  }
  return pending.then((s) => structuredClone(s));
}
