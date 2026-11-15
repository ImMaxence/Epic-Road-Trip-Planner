import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bike, Car, Footprints, Printer, Save, Share2, type LucideIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Label, Radio, RadioGroup, Text } from "react-aria-components";
import { useSearchParams } from "react-router";
import { useLang, useT } from "../../i18n";
import { api, CATEGORIES, type Pin, type Place, type Poi, type TravelMode, type TripPlan } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { localStore } from "../../lib/local-store";
import { daysBetween, formatDuration, formatKm } from "../../lib/format";
import { decodePins, encodePins, paramsFromPlan, readParams, ROUTE_COLOR_HEX, TRAVEL_MODES, writeParams, type PlannerParams } from "../../lib/planner-state";
import { LazyDateRange as DateRange } from "../LazyDateRange";
import { tripTitle } from "../TripCard";
import { useToast } from "../Toast";
import { PlannerMap, type PlannerMapHandle } from "./PlannerMap";
import { PoiExplorer, type CategoryFilter } from "./PoiExplorer";
import { PrintSheet } from "./PrintSheet";
import { SaveDialog, type SaveValues } from "./SaveDialog";
import { ShareDialog } from "./ShareDialog";
import { StopList } from "./StopList";

const PIN_STORE = "ert-pins";
const MODE_ICON: Record<TravelMode, LucideIcon> = { car: Car, bike: Bike, foot: Footprints };

function readPins(signature: string): Pin[] | null {
  try {
    const raw = sessionStorage.getItem(PIN_STORE);
    const parsed = raw ? (JSON.parse(raw) as { signature: string; pins: Pin[] }) : null;
    return parsed?.signature === signature ? parsed.pins : null;
  } catch {
    return null;
  }
}

function writePins(signature: string, pins: Pin[]) {
  try {
    sessionStorage.setItem(PIN_STORE, JSON.stringify({ signature, pins }));
  } catch {
    /* storage unavailable: pins live in memory only */
  }
}

export function Planner() {
  const t = useT();
  const lang = useLang();
  const toast = useToast();
  const client = useQueryClient();
  const { user } = useAuth();
  const [search, setSearch] = useSearchParams();
  const params = useMemo(() => readParams(search), [search]);
  const mapRef = useRef<PlannerMapHandle>(null);
  const [pins, setPins] = useState<Pin[]>([]);

  // Navigations run in a React transition: the URL changes before the next render. Every update is
  // therefore computed from the current URL (not from this render's params), so quick successive
  // edits never overwrite each other.
  const update = useCallback(
    (patch: Partial<PlannerParams> | ((current: PlannerParams) => Partial<PlannerParams>)) => {
      const current = readParams(new URLSearchParams(window.location.search));
      const next = typeof patch === "function" ? patch(current) : patch;
      setSearch(writeParams({ ...current, ...next }).slice(1), { replace: true, preventScrollReset: true });
    },
    [setSearch],
  );

  // ── Pins received in a share link (?p=…) ───────────────────────────────
  const [sharedPins] = useState(() => decodePins(search.get("p")));
  useEffect(() => {
    if (!sharedPins) return;
    setPins(sharedPins);
    update({}); // rewrites the URL without ?p=, pins now live in this tab's session
  }, [sharedPins, update]);

  // ── Saved trip (?trip=ID) ──────────────────────────────────────────────
  const tripQuery = useQuery({ queryKey: ["trip", params.trip], queryFn: () => api.trip(params.trip!).then((r) => r.trip), enabled: Boolean(params.trip), retry: false });
  const trip = tripQuery.data;
  const hydratedTrip = useRef<number | null>(null);
  useEffect(() => {
    if (!trip || hydratedTrip.current === trip.id) return;
    hydratedTrip.current = trip.id;
    setPins(trip.plan.pins ?? []);
    if (!params.from || !params.to) update(paramsFromPlan(trip.plan, trip.id));
  }, [trip, params.from, params.to, update]);

  // ── Trip saved on this device (?local=ID) ─────────────────────────────
  const [localTrip] = useState(() => (params.local ? localStore.trip(params.local) : undefined));
  const [localTitle, setLocalTitle] = useState(localTrip?.title);
  const hydratedLocal = useRef(false);
  useEffect(() => {
    if (!localTrip || hydratedLocal.current) return;
    hydratedLocal.current = true;
    setPins(localTrip.plan.pins ?? []);
    if (!params.from || !params.to) update({ ...paramsFromPlan(localTrip.plan), local: localTrip.id });
  }, [localTrip, params.from, params.to, update]);

  // ── Resolve communes from INSEE codes ─────────────────────────────────
  const codes = useMemo(() => [params.from, ...params.via, params.to].filter(Boolean) as string[], [params]);
  const known = useRef(new Map<string, Place>());
  for (const plan of [trip?.plan, localTrip?.plan]) if (plan) for (const p of [plan.from, plan.to, ...plan.via]) known.current.set(p.code, p);
  const missing = codes.filter((c) => !known.current.has(c));
  const placesQuery = useQuery({
    queryKey: ["places-resolve", missing.join(",")],
    queryFn: () => api.places(missing).then((r) => r.results),
    enabled: missing.length > 0,
    staleTime: Infinity,
  });
  placesQuery.data?.forEach((p) => known.current.set(p.code, p));
  const place = (code?: string) => (code ? known.current.get(code) : undefined);
  const from = place(params.from);
  const to = place(params.to);
  const via = params.via.map((c) => place(c));
  const stops = [from, ...via, to].filter(Boolean) as Place[];
  const complete = Boolean(from && to);
  const signature = stops.map((s) => s.code).join("-");

  // ── Pins persist per itinerary for the session (survives reloads and the login detour) ──
  const restored = useRef("");
  useEffect(() => {
    if (!signature || restored.current === signature || params.trip || params.local || sharedPins) return;
    restored.current = signature;
    const saved = readPins(signature);
    if (saved) setPins(saved);
  }, [signature, params.trip, params.local, sharedPins]);
  useEffect(() => {
    if (signature) writePins(signature, pins);
  }, [signature, pins]);

  // ── Route ─────────────────────────────────────────────────────────────
  const routeQuery = useQuery({
    queryKey: ["route", signature, params.mode],
    queryFn: ({ signal }) => api.route(stops, params.mode, signal),
    enabled: complete && stops.length >= 2,
    staleTime: Infinity,
  });
  const route = complete ? routeQuery.data : undefined;

  // ── Points of interest around the explored stop ────────────────────────
  const [exploreIndex, setExploreIndex] = useState(0);
  const safeExplore = Math.min(exploreIndex, Math.max(0, stops.length - 1));
  const explored = stops[safeExplore];
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [focusedPoiId, setFocusedPoiId] = useState<string>();
  const poiQuery = useQuery({
    queryKey: ["pois", explored?.code, params.radius, params.start, params.end, lang],
    queryFn: ({ signal }) => api.pois({ lat: explored!.lat, lon: explored!.lon, radius: params.radius, from: params.start, to: params.end, lang }, signal),
    enabled: Boolean(explored),
    staleTime: 10 * 60_000,
  });
  const visible = useMemo(() => {
    if (!poiQuery.data) return [] as Poi[];
    return (category === "all" ? CATEGORIES : [category])
      .flatMap((c) => poiQuery.data!.categories[c] ?? [])
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [poiQuery.data, category]);

  const togglePin = (poi: Poi) =>
    setPins((list) =>
      list.some((p) => p.id === poi.id)
        ? list.filter((p) => p.id !== poi.id)
        : [...list, { id: poi.id, stop: safeExplore, name: poi.name, category: poi.category, kind: poi.kind, lat: poi.lat, lon: poi.lon }],
    );

  // ── Stop editing ──────────────────────────────────────────────────────
  const remember = (p?: Place) => p && known.current.set(p.code, p);
  const setVia = (change: (via: string[]) => string[]) => update((current) => ({ via: change(current.via) }));
  const onExplore = (i: number) => {
    setExploreIndex(i);
    setFocusedPoiId(undefined);
    requestAnimationFrame(() => document.getElementById("explore-title")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  // ── Save / share / print ──────────────────────────────────────────────
  const [saveOpen, setSaveOpen] = useState(false);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const isOwner = Boolean(trip?.isOwner);
  const savesLocally = !user;
  const isLocalUpdate = savesLocally && Boolean(params.local && localTitle);
  const defaultTitle = trip ? tripTitle(trip, lang) : localTitle ? localTitle : from && to ? `${from.name} → ${to.name}` : "";

  const buildPlan = (): TripPlan => ({
    version: 1,
    from: from!,
    to: to!,
    via: via.filter(Boolean) as Place[],
    startDate: params.start ?? null,
    endDate: params.end ?? null,
    mapStyle: params.style,
    routeColor: params.color,
    radiusKm: params.radius,
    travelMode: params.mode,
    pins: pins.filter((p) => p.stop < stops.length),
    distanceKm: route?.distanceKm ?? null,
    durationMin: route?.durationMin ?? null,
    ...(isOwner && trip?.plan.titles ? { titles: trip.plan.titles, summary: trip.plan.summary } : {}),
  });

  const onSave = () => {
    if (!complete) return;
    // Without an account the trip is kept in this browser (see lib/local-store.ts).
    setSaveOpen(true);
  };

  const submitSave = async (values: SaveValues) => {
    if (savesLocally) {
      const saved = localStore.saveTrip({ id: params.local, title: values.title, cover: values.cover, plan: buildPlan() });
      if (!saved) throw new Error(t.planner.saveLocalFailed);
      setLocalTitle(saved.title);
      update({ local: saved.id, trip: undefined });
      toast(t.planner.savedLocal);
      return;
    }
    const payload = { ...values, plan: buildPlan() };
    const saved = isOwner && trip ? await api.updateTrip(trip.id, payload) : await api.createTrip(payload);
    hydratedTrip.current = saved.trip.id;
    client.setQueryData(["trip", saved.trip.id], saved.trip);
    void client.invalidateQueries({ queryKey: ["my-trips"] });
    update({ trip: saved.trip.id });
    toast(t.planner.saved);
  };

  // The link carries the whole trip: stops, dates, options and pinned places (not the device-only id).
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const sharedPinList = pins.filter((p) => p.stop < stops.length);
  const onShare = () => {
    const query = writeParams({ ...params, local: undefined });
    const withPins = sharedPinList.length ? `${query}${query ? "&" : "?"}p=${encodePins(sharedPinList)}` : query;
    setShareUrl(`${window.location.origin}${window.location.pathname}${withPins}`);
  };

  const onPrint = () => {
    setSnapshot(mapRef.current?.snapshot() ?? null);
    setTimeout(() => window.print(), 150);
  };
  useEffect(() => {
    const before = () => setSnapshot(mapRef.current?.snapshot() ?? null);
    window.addEventListener("beforeprint", before);
    return () => window.removeEventListener("beforeprint", before);
  }, []);

  const days = daysBetween(params.start, params.end);
  const routeStatus = routeQuery.isFetching ? t.planner.routeLoading : route ? t.planner.routeReady(formatKm(route.distanceKm, lang), formatDuration(route.durationMin, lang)) : "";

  return (
    <div className="planner">
      <section className="planner__panel" aria-labelledby="planner-title">
        <header className="planner__head">
          <p className="eyebrow">{t.brand.name}</p>
          <h1 id="planner-title" tabIndex={-1}>
            {trip ? tripTitle(trip, lang) : (localTitle ?? t.planner.title)}
          </h1>
          {tripQuery.isError ? <p className="notice notice--error">{t.planner.tripNotFound}</p> : null}
          {trip && !trip.isOwner ? <p className="notice notice--info">{t.planner.readOnly(trip.author.name)}</p> : null}
          <dl className="planner__summary">
            <div>
              <dt>{t.planner.summaryDistance}</dt>
              <dd>{formatKm(route?.distanceKm, lang)}</dd>
            </div>
            <div>
              <dt>{t.planner.summaryDuration}</dt>
              <dd>{formatDuration(route?.durationMin, lang)}</dd>
            </div>
            <div>
              <dt>{t.planner.summaryStops}</dt>
              <dd>{stops.length}</dd>
            </div>
            <div>
              <dt>{t.planner.summaryDays}</dt>
              <dd>{days ? t.common.daysCount(days) : "—"}</dd>
            </div>
          </dl>
          <p className="visually-hidden" role="status" aria-live="polite">
            {routeStatus}
          </p>
          {route?.approximate ? <p className="notice notice--warning">{t.planner.approximate}</p> : null}
        </header>

        <section className="planner__section" aria-labelledby="itinerary-title">
          <h2 id="itinerary-title">{t.planner.itinerary}</h2>
          <RadioGroup className="field travel-mode" value={params.mode} onChange={(v) => update({ mode: v as TravelMode })} orientation="horizontal">
            <Label className="field__label">{t.planner.travelMode}</Label>
            <div className="segmented segmented--modes">
              {TRAVEL_MODES.map((m) => {
                const Icon = MODE_ICON[m];
                return (
                  <Radio key={m} value={m} className="radio">
                    <Icon aria-hidden="true" width={18} height={18} /> {t.planner.modes[m]}
                  </Radio>
                );
              })}
            </div>
            <Text slot="description" className="field__hint">
              {t.planner.modeHint}
            </Text>
          </RadioGroup>
          <StopList
            from={from}
            to={to}
            via={via}
            route={route}
            exploreIndex={safeExplore}
            onFrom={(p) => {
              remember(p);
              update({ from: p?.code });
            }}
            onTo={(p) => {
              remember(p);
              update({ to: p?.code });
            }}
            onVia={(i, p) => {
              if (!p) return;
              remember(p);
              setVia((list) => list.map((c, j) => (j === i ? p.code : c)));
            }}
            onAddVia={(p) => {
              remember(p);
              setVia((list) => [...list, p.code]);
            }}
            onRemoveVia={(i) => {
              setVia((list) => list.filter((_, j) => j !== i));
              setPins((list) => list.filter((pin) => pin.stop !== i + 1).map((pin) => (pin.stop > i + 1 ? { ...pin, stop: pin.stop - 1 } : pin)));
            }}
            onMoveVia={(i, dir) => {
              const j = i + dir;
              if (j < 0 || j >= params.via.length) return;
              setVia((current) => {
                const list = [...current];
                if (j >= list.length) return list;
                [list[i], list[j]] = [list[j]!, list[i]!];
                return list;
              });
              setPins((all) => all.map((pin) => (pin.stop === i + 1 ? { ...pin, stop: j + 1 } : pin.stop === j + 1 ? { ...pin, stop: i + 1 } : pin)));
            }}
            onExplore={onExplore}
          />
          <div style={{ marginTop: "1.25rem" }}>
            <DateRange label={t.common.dates} start={params.start} end={params.end} onChange={(r) => update({ start: r.start, end: r.end })} optional />
          </div>
        </section>

        <section className="planner__section" aria-labelledby="explore-title">
          <h2 id="explore-title">
            {t.planner.explore} {explored ? explored.name : "…"}
          </h2>
          <PoiExplorer
            stops={stops}
            exploreIndex={safeExplore}
            onExploreIndex={(i) => {
              setExploreIndex(i);
              setFocusedPoiId(undefined);
            }}
            radius={params.radius}
            onRadius={(r) => update({ radius: r })}
            category={category}
            onCategory={(c) => {
              setCategory(c);
              setFocusedPoiId(undefined);
            }}
            data={poiQuery.data}
            loading={poiQuery.isFetching}
            error={poiQuery.isError}
            visible={visible}
            focusedPoiId={focusedPoiId}
            onFocusPoi={setFocusedPoiId}
            pins={pins}
            onTogglePin={togglePin}
          />
        </section>

        <section className="planner__section" aria-labelledby="notebook-title">
          <h2 id="notebook-title">{t.planner.notebook}</h2>
          {pins.length ? (
            <ol className="notebook">
              {stops.map((stop, i) => {
                const list = pins.filter((p) => p.stop === i);
                if (!list.length) return null;
                return (
                  <li key={`${stop.code}-${i}`}>
                    <h3>{stop.name}</h3>
                    <ul>
                      {list.map((p) => (
                        <li key={p.id}>
                          <span>
                            {p.name} <span className="muted">· {p.kind ? (t.kinds[p.kind] ?? p.kind) : t.categories[p.category]}</span>
                          </span>
                          <button type="button" className="btn btn--ghost btn--small" onClick={() => setPins((all) => all.filter((x) => x.id !== p.id))}>
                            {t.planner.unpin}
                            <span className="visually-hidden"> : {p.name}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="muted">{t.planner.notebookEmpty}</p>
          )}
        </section>

        <section className="planner__section" aria-labelledby="display-title">
          <h2 id="display-title">{t.planner.display}</h2>
          <RadioGroup className="field" value={params.style} onChange={(v) => update({ style: v as PlannerParams["style"] })} orientation="horizontal">
            <Label className="field__label">{t.planner.mapStyle}</Label>
            <div className="segmented">
              {(["atlas", "day", "night"] as const).map((s) => (
                <Radio key={s} value={s} className="radio">
                  {t.planner.styles[s]}
                </Radio>
              ))}
            </div>
          </RadioGroup>
          <RadioGroup className="field" value={params.color} onChange={(v) => update({ color: v as PlannerParams["color"] })} orientation="horizontal" style={{ marginTop: "1rem" }}>
            <Label className="field__label">{t.planner.routeColor}</Label>
            <div className="segmented">
              {(Object.keys(ROUTE_COLOR_HEX) as PlannerParams["color"][]).map((c) => (
                <Radio key={c} value={c} className="radio">
                  <span className="swatch" style={{ background: ROUTE_COLOR_HEX[c] }} aria-hidden="true" />
                  {t.planner.colors[c]}
                </Radio>
              ))}
            </div>
          </RadioGroup>
        </section>

        <div className="planner__actions" role="group" aria-label={t.planner.actions}>
          <button type="button" className="btn btn--red" onClick={onSave} disabled={!complete}>
            <Save aria-hidden="true" /> {isOwner || isLocalUpdate ? t.planner.update : t.planner.save}
          </button>
          <button type="button" className="btn btn--ghost" onClick={onShare} disabled={!complete}>
            <Share2 aria-hidden="true" /> {t.planner.share}
          </button>
          <button type="button" className="btn btn--ghost" onClick={onPrint} disabled={!complete}>
            <Printer aria-hidden="true" /> {t.planner.print}
          </button>
        </div>
      </section>

      <div className="planner__map">
        <PlannerMap
          ref={mapRef}
          stops={stops}
          route={route}
          routeColor={params.color}
          mapStyle={params.style}
          pois={visible}
          exploreCenter={explored}
          radiusKm={params.radius}
          focusedPoiId={focusedPoiId}
          onPoiSelect={setFocusedPoiId}
          pins={pins.filter((p) => p.stop < stops.length)}
          travelMode={params.mode}
          dataUpdatedAt={poiQuery.data?.sources.osm.updatedAt}
        />
      </div>

      <PrintSheet title={defaultTitle || t.planner.title} stops={stops} route={route} pins={pins} start={params.start} end={params.end} mode={params.mode} snapshot={snapshot} />

      <SaveDialog
        isOpen={saveOpen}
        onOpenChange={setSaveOpen}
        isUpdate={isOwner || isLocalUpdate}
        canPublish={Boolean(user)}
        note={savesLocally ? t.planner.saveLocalNote : undefined}
        initial={{
          title: defaultTitle.slice(0, 80),
          cover: trip?.cover ?? (params.local ? localStore.trip(params.local)?.cover : undefined) ?? "city",
          isPublic: trip?.isOwner ? trip.isPublic : false,
        }}
        onSubmit={submitSave}
      />
      <ShareDialog url={shareUrl} title={defaultTitle || t.brand.name} pinCount={sharedPinList.length} onClose={() => setShareUrl(null)} />
    </div>
  );
}
