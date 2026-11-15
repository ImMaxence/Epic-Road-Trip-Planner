import "maplibre-gl/dist/maplibre-gl.css";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import type { GeoJSONSource, Map as MapLibreMap, MapGeoJSONFeature, Marker, Popup } from "maplibre-gl";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useLang, useT } from "../../i18n";
import { CATEGORIES, type Category, type MapStyle, type Pin, type Place, type Poi, type RouteColor, type RouteResult, type TravelMode } from "../../lib/api";
import { formatDate, formatKm } from "../../lib/format";
import { ROUTE_COLOR_HEX } from "../../lib/planner-state";
import { CATEGORY_COLOR, CATEGORY_GLYPH } from "../category";
import { loadStyle, proxiedUrl } from "./map-style";

type MapLibre = typeof import("maplibre-gl");

export interface PlannerMapHandle {
  snapshot: () => string | null;
}

interface PlannerMapProps {
  stops: Place[];
  route?: RouteResult;
  routeColor: RouteColor;
  mapStyle: MapStyle;
  pois: Poi[];
  exploreCenter?: Place;
  radiusKm: number;
  focusedPoiId?: string;
  onPoiSelect: (id: string) => void;
  /** Places pinned to the road book: always highlighted, whatever the category or stop explored. */
  pins: Pin[];
  travelMode: TravelMode;
  /** Unix seconds: when the OpenStreetMap places index was last rebuilt. */
  dataUpdatedAt?: number | null;
}

const FRANCE: [[number, number], [number, number]] = [[-5.3, 41.3], [9.7, 51.2]];

function borneHtml(label: string, tone: "green" | "red" | "blue"): string {
  const cap = { green: "#0b6b47", red: "#c0311d", blue: "#1f4fa8" }[tone];
  const size = label.length > 2 ? 11 : 16;
  return `<svg width="34" height="44" viewBox="0 0 40 52" aria-hidden="true"><path d="M5 51V19a15 15 0 0 1 30 0v32Z" fill="#fffaf0" stroke="#1d2433" stroke-width="2.5"/><path d="M6.25 21v-2a13.75 13.75 0 0 1 27.5 0v2Z" fill="${cap}"/><path d="M5 21h30" stroke="#1d2433" stroke-width="1.5"/><text x="20" y="41" text-anchor="middle" font-size="${size}" font-family="Barlow Condensed, Arial Narrow, sans-serif" font-weight="800" fill="#1d2433">${label}</text></svg>`;
}

function circlePolygon(lat: number, lon: number, km: number) {
  const coords: [number, number][] = [];
  for (let i = 0; i <= 64; i++) {
    const a = (i / 64) * 2 * Math.PI;
    const dLat = (km / 111.32) * Math.sin(a);
    const dLon = (km / (111.32 * Math.cos((lat * Math.PI) / 180))) * Math.cos(a);
    coords.push([lon + dLon, lat + dLat]);
  }
  return { type: "Feature" as const, properties: {}, geometry: { type: "Polygon" as const, coordinates: [coords] } };
}

/** Category glyphs painted into the map canvas (MapLibre symbol layers need raster images). */
function categoryImage(category: Category): ImageData {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.beginPath();
  ctx.arc(32, 32, 28, 0, Math.PI * 2);
  ctx.fillStyle = CATEGORY_COLOR[category];
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = "#fffaf0";
  ctx.stroke();
  ctx.save();
  ctx.translate(14, 14);
  ctx.scale(1.5, 1.5);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke(new Path2D(CATEGORY_GLYPH[category]));
  ctx.restore();
  return ctx.getImageData(0, 0, size, size);
}

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export const PlannerMap = forwardRef<PlannerMapHandle, PlannerMapProps>(function PlannerMap(props, ref) {
  const { stops, route, routeColor, mapStyle, pois, exploreCenter, radiusKm, focusedPoiId, pins, travelMode, dataUpdatedAt } = props;
  const t = useT();
  const lang = useLang();
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const libRef = useRef<MapLibre | null>(null);
  const markers = useRef<Marker[]>([]);
  const popup = useRef<Popup | null>(null);
  const handlersBound = useRef(false);
  const latest = useRef(props);
  const [ready, setReady] = useState(0); // increments on every style load
  const [failed, setFailed] = useState(false);
  latest.current = props;

  useImperativeHandle(ref, () => ({
    snapshot: () => {
      try {
        return mapRef.current?.getCanvas().toDataURL("image/png") ?? null;
      } catch {
        return null;
      }
    },
  }));

  // Create the map once.
  useEffect(() => {
    let cancelled = false;
    let map: MapLibreMap | undefined;
    // Let the road book render and become interactive first; the map starts when the browser is idle.
    const idle = (cb: () => void) =>
      typeof window.requestIdleCallback === "function" ? window.requestIdleCallback(cb, { timeout: 1200 }) : setTimeout(cb, 200);
    idle(async () => {
      try {
        const lib = await import("maplibre-gl");
        lib.setWorkerUrl(workerUrl);
        const style = await loadStyle(latest.current.mapStyle);
        if (cancelled || !container.current) return;
        libRef.current = lib;
        map = new lib.Map({
          container: container.current,
          style: style as never,
          bounds: FRANCE,
          fitBoundsOptions: { padding: 20 },
          attributionControl: { compact: true },
          transformRequest: (url) => ({ url: proxiedUrl(url) }),
          canvasContextAttributes: { preserveDrawingBuffer: true },
          cooperativeGestures: false,
          locale: lang === "fr"
            ? {
                "NavigationControl.ZoomIn": "Zoom avant",
                "NavigationControl.ZoomOut": "Zoom arrière",
                "NavigationControl.ResetBearing": "Réorienter vers le nord",
                "FullscreenControl.Enter": "Plein écran",
                "FullscreenControl.Exit": "Quitter le plein écran",
                "Popup.Close": "Fermer",
                "Map.Title": "Carte",
              }
            : undefined,
        });
        map.getCanvas().setAttribute("aria-label", t.planner.mapLabel);
        map.addControl(new lib.NavigationControl({ visualizePitch: false }), "top-right");
        map.addControl(new lib.FullscreenControl(), "top-right");
        map.addControl(new lib.ScaleControl({ unit: "metric" }), "bottom-right");
        map.on("style.load", () => setReady((n) => n + 1));
        mapRef.current = map;
      } catch {
        if (!cancelled) setFailed(true);
      }
    });
    return () => {
      cancelled = true;
      map?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Switch basemap.
  const styleRef = useRef(mapStyle);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || styleRef.current === mapStyle) return;
    styleRef.current = mapStyle;
    void loadStyle(mapStyle).then((style) => map.setStyle(style as never, { diff: false }));
  }, [mapStyle]);

  // (Re)install overlays after each style load.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    for (const category of CATEGORIES) {
      const name = `cat-${category}`;
      if (!map.hasImage(name)) map.addImage(name, categoryImage(category), { pixelRatio: 2 });
    }
    const empty = { type: "FeatureCollection" as const, features: [] };
    if (!map.getSource("explore")) map.addSource("explore", { type: "geojson", data: empty });
    if (!map.getSource("route")) map.addSource("route", { type: "geojson", data: empty });
    if (!map.getSource("pins")) map.addSource("pins", { type: "geojson", data: empty });
    if (!map.getSource("pois")) {
      map.addSource("pois", { type: "geojson", data: empty, cluster: true, clusterMaxZoom: 13, clusterRadius: 44 });
    }
    if (!map.getLayer("explore-fill")) {
      map.addLayer({ id: "explore-fill", type: "fill", source: "explore", paint: { "fill-color": "#f2b705", "fill-opacity": 0.12 } });
      map.addLayer({ id: "explore-line", type: "line", source: "explore", paint: { "line-color": "#1d2433", "line-width": 1.5, "line-dasharray": [2, 2] } });
      // Highlighter stroke under the route, like marking a paper road atlas.
      map.addLayer({ id: "route-glow", type: "line", source: "route", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#f2b705", "line-opacity": 0.55, "line-blur": 2, "line-width": ["interpolate", ["linear"], ["zoom"], 4, 14, 12, 30] } });
      map.addLayer({ id: "route-casing", type: "line", source: "route", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#1d2433", "line-width": ["interpolate", ["linear"], ["zoom"], 4, 6, 12, 13] } });
      map.addLayer({ id: "route-line", type: "line", source: "route", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": ROUTE_COLOR_HEX.red, "line-width": ["interpolate", ["linear"], ["zoom"], 4, 4, 12, 10] } });
      map.addLayer({ id: "route-dash", type: "line", source: "route", layout: { "line-join": "round" }, paint: { "line-color": "#fffaf0", "line-width": ["interpolate", ["linear"], ["zoom"], 4, 0.8, 12, 1.8], "line-dasharray": [3, 3] } });
      map.addLayer({ id: "poi-clusters", type: "circle", source: "pois", filter: ["has", "point_count"], paint: { "circle-color": "#1d2433", "circle-radius": ["step", ["get", "point_count"], 15, 20, 19, 60, 24], "circle-stroke-color": "#f2b705", "circle-stroke-width": 3 } });
      map.addLayer({ id: "poi-cluster-count", type: "symbol", source: "pois", filter: ["has", "point_count"], layout: { "text-field": ["get", "point_count_abbreviated"], "text-font": ["Noto Sans Bold"], "text-size": 13 }, paint: { "text-color": "#ffffff" } });
      map.addLayer({ id: "poi-selected", type: "circle", source: "pois", filter: ["==", ["get", "id"], ""], paint: { "circle-radius": 21, "circle-color": "rgba(242,183,5,0.35)", "circle-stroke-color": "#1d2433", "circle-stroke-width": 3 } });
      map.addLayer({ id: "poi-points", type: "symbol", source: "pois", filter: ["!", ["has", "point_count"]], layout: { "icon-image": ["concat", "cat-", ["get", "category"]], "icon-size": 1, "icon-allow-overlap": true } });
      // Pinned places sit on top: yellow highlighter halo, larger icon and their name.
      map.addLayer({ id: "pin-halo", type: "circle", source: "pins", paint: { "circle-radius": 23, "circle-color": "rgba(242,183,5,0.55)", "circle-stroke-color": "#1d2433", "circle-stroke-width": 3 } });
      map.addLayer({
        id: "pin-icons",
        type: "symbol",
        source: "pins",
        layout: {
          "icon-image": ["concat", "cat-", ["get", "category"]],
          "icon-size": 1.3,
          "icon-allow-overlap": true,
          "text-field": ["get", "name"],
          "text-font": ["Noto Sans Bold"],
          "text-size": 12,
          "text-offset": [0, 2.1],
          "text-anchor": "top",
          "text-optional": true,
          "text-max-width": 10,
        },
        paint: { "text-color": "#1d2433", "text-halo-color": "#fffaf0", "text-halo-width": 2 },
      });
    }
    // Layer-bound handlers survive style switches: register them only once.
    if (!handlersBound.current) {
      handlersBound.current = true;
      map.on("click", "poi-points", (e) => {
        const feature = e.features?.[0] as MapGeoJSONFeature | undefined;
        if (feature?.properties?.id) latest.current.onPoiSelect(String(feature.properties.id));
      });
      map.on("click", "poi-clusters", async (e) => {
        const feature = e.features?.[0];
        const source = map.getSource("pois") as GeoJSONSource | undefined;
        if (!feature || !source) return;
        const zoom = await source.getClusterExpansionZoom(feature.properties.cluster_id as number);
        map.easeTo({ center: (feature.geometry as unknown as { coordinates: [number, number] }).coordinates, zoom });
      });
      map.on("click", "pin-icons", (e) => {
        const props = e.features?.[0]?.properties;
        if (!props?.id) return;
        const id = String(props.id);
        // Open the list entry when the pin belongs to the stop being explored, otherwise just name it.
        if (latest.current.pois.some((p) => p.id === id)) {
          latest.current.onPoiSelect(id);
          return;
        }
        const lib = libRef.current;
        if (!lib) return;
        popup.current?.remove();
        const node = document.createElement("div");
        node.className = "map-popup";
        node.innerHTML = `<strong>${escapeHtml(String(props.name))}</strong><span>${escapeHtml(String(props.label))}</span>`;
        popup.current = new lib.Popup({ offset: 22, maxWidth: "260px" }).setLngLat(e.lngLat).setDOMContent(node).addTo(map);
      });
      for (const layer of ["poi-points", "poi-clusters", "pin-icons"]) {
        map.on("mouseenter", layer, () => (map.getCanvas().style.cursor = "pointer"));
        map.on("mouseleave", layer, () => (map.getCanvas().style.cursor = ""));
      }
    }
  }, [ready]);

  // Route line.
  useEffect(() => {
    const map = mapRef.current;
    const source = map?.getSource("route") as GeoJSONSource | undefined;
    if (!map || !source) return;
    source.setData(route ? { type: "Feature", properties: {}, geometry: route.geometry } : { type: "FeatureCollection", features: [] });
    map.setPaintProperty("route-line", "line-color", ROUTE_COLOR_HEX[routeColor]);
    map.setPaintProperty("route-casing", "line-color", routeColor === "ink" ? "#fffaf0" : "#1d2433");
    // Car: a road with its centre line. Bike: a plain cycle track. On foot: a dotted footpath.
    map.setLayoutProperty("route-dash", "visibility", travelMode === "car" ? "visible" : "none");
    map.setPaintProperty("route-line", "line-dasharray", travelMode === "foot" ? [0.6, 1.4] : undefined);
    map.setPaintProperty("route-casing", "line-dasharray", travelMode === "foot" ? [0.6, 1.4] : undefined);
  }, [route, routeColor, travelMode, ready]);

  // Pinned places.
  useEffect(() => {
    const source = mapRef.current?.getSource("pins") as GeoJSONSource | undefined;
    if (!source) return;
    source.setData({
      type: "FeatureCollection",
      features: pins.map((p) => ({
        type: "Feature",
        properties: { id: p.id, category: p.category, name: p.name, label: p.kind ? (t.kinds[p.kind] ?? p.kind) : t.categories[p.category] },
        geometry: { type: "Point", coordinates: [p.lon, p.lat] },
      })),
    });
  }, [pins, ready, t]);

  // Stop markers + framing.
  const framed = useRef("");
  useEffect(() => {
    const map = mapRef.current;
    const lib = libRef.current;
    if (!map || !lib || !ready) return;
    markers.current.forEach((m) => m.remove());
    markers.current = stops.map((stop, i) => {
      const el = document.createElement("div");
      el.className = "map-borne";
      el.setAttribute("aria-hidden", "true");
      const isFirst = i === 0;
      const isLast = i === stops.length - 1 && stops.length > 1;
      el.innerHTML = borneHtml(isFirst ? "A" : isLast ? "B" : String(i), isFirst ? "green" : isLast ? "blue" : "red");
      el.title = stop.name;
      return new lib.Marker({ element: el, anchor: "bottom" }).setLngLat([stop.lon, stop.lat]).addTo(map);
    });
    const key = stops.map((s) => s.code).join(",");
    if (stops.length && key !== framed.current) {
      framed.current = key;
      if (stops.length === 1) map.flyTo({ center: [stops[0]!.lon, stops[0]!.lat], zoom: 10 });
      else {
        const bounds = new lib.LngLatBounds();
        stops.forEach((s) => bounds.extend([s.lon, s.lat]));
        route?.geometry.coordinates.forEach((c) => bounds.extend(c));
        map.fitBounds(bounds, { padding: { top: 60, bottom: 60, left: 60, right: 60 }, maxZoom: 11, duration: 700 });
      }
    }
  }, [stops, ready, route]);

  // Exploration radius.
  useEffect(() => {
    const source = mapRef.current?.getSource("explore") as GeoJSONSource | undefined;
    if (!source) return;
    source.setData(exploreCenter ? circlePolygon(exploreCenter.lat, exploreCenter.lon, radiusKm) : { type: "FeatureCollection", features: [] });
  }, [exploreCenter, radiusKm, ready]);

  // POIs.
  useEffect(() => {
    const source = mapRef.current?.getSource("pois") as GeoJSONSource | undefined;
    if (!source) return;
    source.setData({
      type: "FeatureCollection",
      features: pois.map((p) => ({ type: "Feature", properties: { id: p.id, category: p.category }, geometry: { type: "Point", coordinates: [p.lon, p.lat] } })),
    });
  }, [pois, ready]);

  // Focused POI: highlight, fly to it and open a popup.
  useEffect(() => {
    const map = mapRef.current;
    const lib = libRef.current;
    if (!map || !lib || !ready) return;
    if (map.getLayer("poi-selected")) map.setFilter("poi-selected", ["==", ["get", "id"], focusedPoiId ?? ""]);
    popup.current?.remove();
    const poi = pois.find((p) => p.id === focusedPoiId);
    if (!poi) return;
    map.flyTo({ center: [poi.lon, poi.lat], zoom: Math.max(map.getZoom(), 14), duration: 600 });
    const kind = poi.kind ? (t.kinds[poi.kind] ?? poi.kind) : t.categories[poi.category];
    const node = document.createElement("div");
    node.className = "map-popup";
    node.innerHTML = `<strong>${escapeHtml(poi.name)}</strong><span>${escapeHtml(kind)} · ${escapeHtml(formatKm(poi.distanceKm, lang))}</span>`;
    popup.current = new lib.Popup({ offset: 18, closeButton: true, maxWidth: "260px" }).setLngLat([poi.lon, poi.lat]).setDOMContent(node).addTo(map);
  }, [focusedPoiId, pois, ready, t, lang]);

  return (
    <div className="planner-map" role="region" aria-label={t.planner.mapLabel}>
      <div ref={container} className="planner-map__canvas" />
      {failed ? <p className="notice notice--error planner-map__error">{t.planner.poiSourceUnavailable}</p> : null}
      <div className="map-legend" aria-hidden="true">
        <p className="map-legend__title">{t.planner.legend}</p>
        <ul>
          <li><span className="map-legend__route" style={{ background: ROUTE_COLOR_HEX[routeColor] }} /> {t.planner.itinerary}</li>
          {pins.length ? (
            <li>
              <span className="map-legend__pin" /> {t.planner.pinnedLegend} ({pins.length})
            </li>
          ) : null}
          {CATEGORIES.filter((c) => pois.some((p) => p.category === c)).map((c) => (
            <li key={c}>
              <span className="map-legend__dot" style={{ background: CATEGORY_COLOR[c] }} /> {t.categories[c]}
            </li>
          ))}
        </ul>
        {dataUpdatedAt ? <p className="map-legend__date">{t.planner.dataUpdatedShort(formatDate(new Date(dataUpdatedAt * 1000).toISOString(), lang))}</p> : null}
      </div>
    </div>
  );
});
