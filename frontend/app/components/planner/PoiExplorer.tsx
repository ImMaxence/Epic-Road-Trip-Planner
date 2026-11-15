import { ChevronDown, Clock, ExternalLink, LayoutGrid, MapPin, Phone, Pin, PinOff } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Button, Disclosure, DisclosurePanel, Heading, Label, ListBox, ListBoxItem, Popover, Select, SelectValue, ToggleButton, ToggleButtonGroup } from "react-aria-components";
import { useLang, useT } from "../../i18n";
import { CATEGORIES, type Category, type Pin as PinType, type Place, type Poi, type PoiResponse } from "../../lib/api";
import { formatDate, formatKm, safeHttpUrl, telHref } from "../../lib/format";
import { RADII } from "../../lib/planner-state";
import { CATEGORY_COLOR, CategoryIcon } from "../category";

export type CategoryFilter = Category | "all";

interface PoiExplorerProps {
  stops: Place[];
  exploreIndex: number;
  onExploreIndex: (i: number) => void;
  radius: number;
  onRadius: (r: number) => void;
  category: CategoryFilter;
  onCategory: (c: CategoryFilter) => void;
  data?: PoiResponse;
  loading: boolean;
  error: boolean;
  visible: Poi[];
  focusedPoiId?: string;
  onFocusPoi: (id: string) => void;
  pins: PinType[];
  onTogglePin: (poi: Poi) => void;
}

const PAGE = 30;
const PER_GROUP = 5;

function PoiDetails({ poi, level }: { poi: Poi; level: 4 | 5 }) {
  const t = useT();
  const lang = useLang();
  const website = safeHttpUrl(poi.website);
  const rows = [
    poi.dateStart ? { label: t.categories.events, value: t.planner.eventDates(formatDate(poi.dateStart, lang), formatDate(poi.dateEnd ?? poi.dateStart, lang)) } : null,
    poi.openingHours ? { label: t.planner.openingHours, value: poi.openingHours } : null,
    poi.cuisine ? { label: t.planner.cuisine, value: poi.cuisine } : null,
    poi.price ? { label: t.planner.price, value: poi.price } : null,
    poi.wheelchair ? { label: "♿", value: t.planner.wheelchair[poi.wheelchair] } : null,
  ].filter(Boolean) as { label: string; value: string }[];
  if (!rows.length && !poi.description && !website && !poi.phone) return null;

  return (
    <Disclosure className="poi__details">
      <Heading level={level}>
        <Button slot="trigger" className="poi__details-trigger">
          {t.planner.details} <ChevronDown aria-hidden="true" width={18} height={18} />
          <span className="visually-hidden"> — {poi.name}</span>
        </Button>
      </Heading>
      <DisclosurePanel>
        <div className="poi__details-body">
          {poi.description ? <p>{poi.description}</p> : null}
          {rows.length ? (
            <dl>
              {rows.map((r) => (
                <div key={r.label}>
                  <dt>{r.label === t.planner.openingHours ? <Clock aria-hidden="true" width={14} height={14} /> : null} {r.label}</dt>
                  <dd>{r.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          <p className="poi__links">
            {poi.phone ? (
              <a href={telHref(poi.phone)}>
                <Phone aria-hidden="true" width={16} height={16} /> {poi.phone}
              </a>
            ) : null}
            {website ? (
              <a href={website} target="_blank" rel="noopener noreferrer nofollow">
                <ExternalLink aria-hidden="true" width={16} height={16} /> {t.planner.website}
                <span className="visually-hidden"> {poi.name} {t.a11y.externalLink}</span>
              </a>
            ) : null}
          </p>
        </div>
      </DisclosurePanel>
    </Disclosure>
  );
}

interface PoiItemProps {
  poi: Poi;
  focused: boolean;
  pinned: boolean;
  level: 3 | 4;
  onFocusPoi: (id: string) => void;
  onTogglePin: (poi: Poi) => void;
}

function PoiItem({ poi, focused, pinned, level, onFocusPoi, onTogglePin }: PoiItemProps) {
  const t = useT();
  const lang = useLang();
  const kind = poi.kind ? (t.kinds[poi.kind] ?? poi.kind) : t.categories[poi.category];
  const Title = level === 3 ? "h3" : "h4";
  return (
    <li id={`poi-${poi.id}`} className={`poi ${focused ? "is-focused" : ""} ${pinned ? "is-pinned" : ""}`} style={{ ["--cat" as string]: CATEGORY_COLOR[poi.category] }}>
      <span className="poi__icon" aria-hidden="true">
        <CategoryIcon category={poi.category} size={20} />
      </span>
      <div className="poi__main">
        <Title className="poi__name">{poi.name}</Title>
        <p className="poi__meta">
          <span>{kind}</span> · <span>{t.planner.distanceFromStop(formatKm(poi.distanceKm, lang))}</span>
          {pinned ? <span className="badge badge--pinned">{t.planner.pinned}</span> : null}
        </p>
        {poi.address ? <p className="poi__addr">{poi.address}</p> : null}
        <div className="poi__actions">
          <button type="button" className="btn btn--ghost btn--small" onClick={() => onFocusPoi(poi.id)}>
            <MapPin aria-hidden="true" /> {t.planner.showOnMap}
            <span className="visually-hidden"> : {poi.name}</span>
          </button>
          <ToggleButton className="btn btn--small pin-toggle" isSelected={pinned} onChange={() => onTogglePin(poi)}>
            {pinned ? <PinOff aria-hidden="true" /> : <Pin aria-hidden="true" />} {t.planner.pin}
            <span className="visually-hidden"> : {poi.name}</span>
          </ToggleButton>
        </div>
        <PoiDetails poi={poi} level={level === 3 ? 4 : 5} />
      </div>
    </li>
  );
}

export function PoiExplorer(props: PoiExplorerProps) {
  const { stops, exploreIndex, onExploreIndex, radius, onRadius, category, onCategory, data, loading, error, visible, focusedPoiId, onFocusPoi, pins, onTogglePin } = props;
  const t = useT();
  const lang = useLang();
  const [limit, setLimit] = useState(PAGE);
  const place = stops[exploreIndex];
  const pinned = useMemo(() => new Set(pins.map((p) => p.id)), [pins]);

  useEffect(() => setLimit(PAGE), [exploreIndex, radius, category]);

  // Keep the list item in view when a marker is clicked on the map.
  useEffect(() => {
    if (!focusedPoiId) return;
    const poi = visible.find((p) => p.id === focusedPoiId);
    if (!poi) return;
    if (category === "all") onCategory(poi.category);
    else {
      const index = visible.findIndex((p) => p.id === focusedPoiId);
      if (index >= limit) setLimit(index + 1);
    }
    requestAnimationFrame(() => document.getElementById(`poi-${focusedPoiId}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedPoiId]);

  const counts = useMemo(() => {
    const c = {} as Record<Category, number>;
    for (const cat of CATEGORIES) c[cat] = data?.categories[cat]?.length ?? 0;
    return c;
  }, [data]);
  const total = CATEGORIES.reduce((n, c) => n + counts[c], 0);

  const status = loading
    ? t.planner.poiLoading
    : error
      ? t.planner.poiError
      : place && data
        ? visible.length
          ? t.planner.poiFound(visible.length, place.name)
          : t.planner.poiEmpty
        : "";

  const updatedAt = data?.sources.osm.updatedAt;

  if (!stops.length) return <p className="muted">{t.planner.emptyText}</p>;

  const item = (poi: Poi, level: 3 | 4): ReactNode => (
    <PoiItem key={poi.id} poi={poi} level={level} focused={focusedPoiId === poi.id} pinned={pinned.has(poi.id)} onFocusPoi={onFocusPoi} onTogglePin={onTogglePin} />
  );

  return (
    <div className="explorer">
      <div className="explorer__controls">
        <Select className="field" selectedKey={String(exploreIndex)} onSelectionChange={(k) => onExploreIndex(Number(k))}>
          <Label className="field__label">{t.planner.exploreStop}</Label>
          <Button className="select-trigger">
            <SelectValue />
            <ChevronDown aria-hidden="true" width={18} height={18} />
          </Button>
          <Popover className="popover">
            <ListBox className="listbox">
              {stops.map((s, i) => (
                <ListBoxItem key={`${s.code}-${i}`} id={String(i)} className="listbox-item" textValue={s.name}>
                  {i === 0 ? "A" : i === stops.length - 1 ? "B" : i} · {s.name}
                </ListBoxItem>
              ))}
            </ListBox>
          </Popover>
        </Select>
        <Select className="field" selectedKey={String(radius)} onSelectionChange={(k) => onRadius(Number(k))}>
          <Label className="field__label">{t.planner.radius}</Label>
          <Button className="select-trigger">
            <SelectValue />
            <ChevronDown aria-hidden="true" width={18} height={18} />
          </Button>
          <Popover className="popover">
            <ListBox className="listbox">
              {RADII.map((r) => (
                <ListBoxItem key={r} id={String(r)} className="listbox-item">
                  {t.planner.radiusValue(r)}
                </ListBoxItem>
              ))}
            </ListBox>
          </Popover>
        </Select>
      </div>

      {/* One category at a time (or all): the list and the map below follow the chosen chip. */}
      <ToggleButtonGroup
        className="cat-toggles"
        aria-label={t.planner.categoriesLabel}
        selectionMode="single"
        disallowEmptySelection
        selectedKeys={[category]}
        onSelectionChange={(keys) => {
          const next = [...keys][0];
          if (next) onCategory(next as CategoryFilter);
        }}
      >
        <ToggleButton id="all" className="cat-toggle" style={{ ["--cat" as string]: "#1d2433" }}>
          <LayoutGrid width={18} height={18} aria-hidden="true" />
          <span>{t.planner.allCategories}</span>
          <span className="cat-toggle__count">{data ? total : "·"}</span>
        </ToggleButton>
        {CATEGORIES.map((c) => (
          <ToggleButton key={c} id={c} className="cat-toggle" style={{ ["--cat" as string]: CATEGORY_COLOR[c] }} isDisabled={Boolean(data) && counts[c] === 0}>
            <CategoryIcon category={c} />
            <span>{t.categories[c]}</span>
            <span className="cat-toggle__count">{data ? counts[c] : "·"}</span>
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <p className="explorer__status" role="status" aria-live="polite">
        {loading ? <span className="spinner" aria-hidden="true" /> : null} {status}
      </p>
      {data?.sources.osm.status === "unavailable" ? <p className="notice notice--warning">{t.planner.poiSourceUnavailable}</p> : null}
      {data?.sources.osm.via === "overpass" ? <p className="notice notice--info">{t.planner.poiSourcePending}</p> : null}

      {category === "all" ? (
        <div className="poi-groups">
          {CATEGORIES.filter((c) => counts[c] > 0).map((c) => {
            const list = visible.filter((p) => p.category === c);
            return (
              <section key={c} className="poi-group" aria-labelledby={`group-${c}`} style={{ ["--cat" as string]: CATEGORY_COLOR[c] }}>
                <h3 id={`group-${c}`} className="poi-group__title">
                  <CategoryIcon category={c} /> {t.categories[c]} <span className="poi-group__count">({list.length})</span>
                </h3>
                <ul className="poi-list">{list.slice(0, PER_GROUP).map((poi) => item(poi, 4))}</ul>
                {list.length > PER_GROUP ? (
                  <button type="button" className="btn btn--ghost btn--small poi-group__more" onClick={() => onCategory(c)}>
                    {t.planner.showCategory(list.length, t.categories[c])}
                  </button>
                ) : null}
              </section>
            );
          })}
        </div>
      ) : (
        <>
          {visible.length ? <ul className="poi-list">{visible.slice(0, limit).map((poi) => item(poi, 3))}</ul> : null}
          {visible.length > limit ? (
            <button type="button" className="btn btn--ghost btn--block" onClick={() => setLimit((l) => l + PAGE)}>
              {t.common.loadMore} ({visible.length - limit})
            </button>
          ) : null}
        </>
      )}

      {updatedAt ? <p className="explorer__freshness">{t.planner.dataUpdated(formatDate(new Date(updatedAt * 1000).toISOString(), lang))}</p> : null}
    </div>
  );
}
