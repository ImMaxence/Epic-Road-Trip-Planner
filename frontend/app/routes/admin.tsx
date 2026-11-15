import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Database, Eye, EyeOff, LogOut, Plus, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, type MetaFunction } from "react-router";
import { Field } from "../components/Fields";
import { GoogleMark } from "../components/GoogleMark";
import { useToast } from "../components/Toast";
import { TripCard, tripTitle } from "../components/TripCard";
import { DICTS, langFromPath, useHref, useLang, useT } from "../i18n";
import { api, type DataSource, type TripSummary } from "../lib/api";
import { useAuth, usePublicConfig } from "../lib/auth";
import { apiErrorText } from "../lib/auth-utils";
import { formatDate } from "../lib/format";
import { seo } from "../lib/seo";

export const meta: MetaFunction = ({ location }) => {
  const t = DICTS[langFromPath(location.pathname)];
  return seo({ pathname: location.pathname, title: t.admin.metaTitle, noindex: true });
};

const PAGE = 25;

/** Debounced copy of a value (search fields). */
function useDebounced<T>(value: T, ms = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

function Pager({ offset, total, onChange, label }: { offset: number; total: number; onChange: (offset: number) => void; label: string }) {
  const t = useT();
  if (total <= PAGE) return null;
  const page = Math.floor(offset / PAGE) + 1;
  const pages = Math.ceil(total / PAGE);
  return (
    <nav className="pager" aria-label={label}>
      <button type="button" className="btn btn--ghost btn--small" disabled={page <= 1} onClick={() => onChange(offset - PAGE)}>
        <ChevronLeft aria-hidden="true" /> {t.admin.prev}
      </button>
      <span>{t.admin.page(page, pages)}</span>
      <button type="button" className="btn btn--ghost btn--small" disabled={page >= pages} onClick={() => onChange(offset + PAGE)}>
        {t.admin.next} <ChevronRight aria-hidden="true" />
      </button>
    </nav>
  );
}

function TripsSection() {
  const t = useT();
  const lang = useLang();
  const href = useHref();
  const toast = useToast();
  const client = useQueryClient();
  const [q, setQ] = useState("");
  const [offset, setOffset] = useState(0);
  const search = useDebounced(q.trim());
  useEffect(() => setOffset(0), [search]);

  const trips = useQuery({
    queryKey: ["admin", "trips", search, offset],
    queryFn: () => api.admin.trips({ q: search || undefined, limit: PAGE, offset }),
    placeholderData: keepPreviousData,
  });
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ["admin"] });
    void client.invalidateQueries({ queryKey: ["trips"] });
  };

  const unpublish = async (trip: TripSummary) => {
    try {
      await api.admin.setTripPublic(trip.id, false);
      toast(t.admin.unpublished);
      refresh();
    } catch (err) {
      toast(apiErrorText(t, err), "error");
    }
  };
  const remove = async (trip: TripSummary) => {
    if (!window.confirm(t.admin.deleteTripConfirm(tripTitle(trip, lang)))) return;
    try {
      await api.admin.deleteTrip(trip.id);
      toast(t.admin.tripDeleted);
      refresh();
    } catch (err) {
      toast(apiErrorText(t, err), "error");
    }
  };

  return (
    <section className="panel admin-section" aria-labelledby="admin-trips-title">
      <div className="admin-section__head">
        <h2 id="admin-trips-title">{t.admin.tripsTitle}</h2>
        {trips.data ? <p aria-live="polite">{t.common.tripsCount(trips.data.total)}</p> : null}
      </div>
      <div className="admin-toolbar">
        <Field id="admin-trips-q" label={t.admin.tripsSearch} value={q} onChange={setQ} maxLength={120} />
      </div>
      {trips.data?.items.length ? (
        <div className="table-wrap">
          <table className="admin-table">
            <caption className="visually-hidden">{t.admin.tripsTitle}</caption>
            <thead>
              <tr>
                <th scope="col">{t.admin.colTrip}</th>
                <th scope="col">{t.admin.colUser}</th>
                <th scope="col">{t.admin.colCreated}</th>
                <th scope="col">{t.admin.colActions}</th>
              </tr>
            </thead>
            <tbody>
              {trips.data.items.map((trip) => {
                const title = tripTitle(trip, lang);
                return (
                  <tr key={trip.id}>
                    <th scope="row" data-label={t.admin.colTrip}>
                      <Link to={`${href("planner")}?trip=${trip.id}`}>{title}</Link>
                      <span className="admin-table__email">
                        {trip.from.name} → {trip.to.name}
                        {trip.featured ? ` · ${t.common.teamPick}` : ""}
                      </span>
                    </th>
                    <td data-label={t.admin.colUser}>{trip.author.name}</td>
                    <td data-label={t.admin.colCreated}>{formatDate(trip.createdAt, lang)}</td>
                    <td data-label={t.admin.colActions}>
                      <div className="admin-table__actions">
                        <button type="button" className="btn btn--ghost btn--small" onClick={() => void unpublish(trip)} aria-label={t.admin.unpublish(title)}>
                          <EyeOff aria-hidden="true" /> {t.admin.unpublishShort}
                        </button>
                        <button type="button" className="btn btn--danger btn--small" onClick={() => void remove(trip)} aria-label={t.admin.deleteTrip(title)}>
                          <Trash2 aria-hidden="true" /> {t.admin.deleteShort}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : trips.isPending ? (
        <p className="loading-line">
          <span className="spinner" aria-hidden="true" /> {t.a11y.loading}
        </p>
      ) : (
        <p className="empty-state">{t.admin.empty}</p>
      )}
      <Pager offset={offset} total={trips.data?.total ?? 0} onChange={setOffset} label={t.admin.tripsTitle} />
    </section>
  );
}

/** Freshness of the map data and manual rebuild (the current index keeps serving meanwhile). */
function MapData() {
  const t = useT();
  const lang = useLang();
  const toast = useToast();
  const client = useQueryClient();
  const data = useQuery({
    queryKey: ["admin", "data"],
    queryFn: api.admin.data,
    // Poll while a rebuild runs, so the date updates by itself when it finishes.
    refetchInterval: (q) => (q.state.data && Object.values(q.state.data).some((s) => s.job === "running") ? 10_000 : false),
  });
  const refresh = async (source: "osm" | "datatourisme") => {
    if (!window.confirm(t.admin.dataRefreshConfirm)) return;
    try {
      const res = await api.admin.refreshData(source);
      toast(res.started ? t.admin.dataStarted : t.admin.dataAlready);
      void client.invalidateQueries({ queryKey: ["admin", "data"] });
    } catch (err) {
      toast(apiErrorText(t, err), "error");
    }
  };
  const status = (s: DataSource) =>
    !s.configured
      ? t.admin.dataNotConfigured
      : s.job === "running"
        ? t.admin.dataRunning
        : s.job?.startsWith("failed")
          ? t.admin.dataFailed
          : s.updatedAt
            ? `${t.admin.dataUpdated(new Date(s.updatedAt * 1000).toLocaleString(DICTS[lang].locale, { dateStyle: "long", timeStyle: "short" }))} · ${t.admin.dataCount(s.count)}`
            : t.admin.dataNever;
  const rows = data.data
    ? ([
        ["osm", t.admin.sourceOsm, data.data.osm],
        ["datatourisme", t.admin.sourceDt, data.data.datatourisme],
      ] as const)
    : [];

  return (
    <section className="panel admin-section" aria-labelledby="admin-data-title">
      <div className="admin-section__head">
        <h2 id="admin-data-title">
          <Database aria-hidden="true" /> {t.admin.dataTitle}
        </h2>
      </div>
      <p>{t.admin.dataLead}</p>
      {data.isError ? (
        <p className="notice notice--error" role="alert">
          {t.admin.dataUnavailable}
        </p>
      ) : null}
      <ul className="data-sources" aria-live="polite">
        {rows.map(([key, label, s]) => (
          <li key={key}>
            <div>
              <strong>{label}</strong>
              <span className={s.job?.startsWith("failed") ? "data-sources__status is-error" : "data-sources__status"}>
                {s.job === "running" ? <span className="spinner" aria-hidden="true" /> : null} {status(s)}
              </span>
            </div>
            {s.configured ? (
              <button type="button" className="btn btn--small" onClick={() => void refresh(key)} disabled={s.job === "running"} aria-label={t.admin.dataRefreshLabel(label)}>
                <RefreshCw aria-hidden="true" /> {t.admin.dataRefresh}
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function MyTrips() {
  const t = useT();
  const lang = useLang();
  const href = useHref();
  const toast = useToast();
  const client = useQueryClient();
  const mine = useQuery({ queryKey: ["my-trips"], queryFn: () => api.myTrips().then((r) => r.items) });
  const togglePublic = async (trip: TripSummary) => {
    try {
      await api.admin.setTripPublic(trip.id, !trip.isPublic);
      toast(trip.isPublic ? t.admin.unpublished : t.admin.published1);
      void client.invalidateQueries({ queryKey: ["my-trips"] });
      void client.invalidateQueries({ queryKey: ["admin"] });
    } catch (err) {
      toast(apiErrorText(t, err), "error");
    }
  };
  const remove = async (trip: TripSummary) => {
    if (!window.confirm(t.admin.deleteTripConfirm(tripTitle(trip, lang)))) return;
    await api.deleteTrip(trip.id).catch(() => undefined);
    toast(t.admin.tripDeleted);
    void client.invalidateQueries({ queryKey: ["my-trips"] });
    void client.invalidateQueries({ queryKey: ["admin"] });
  };
  return (
    <section aria-labelledby="admin-mine-title">
      <div className="section__head" style={{ marginBottom: "1.5rem" }}>
        <h2 id="admin-mine-title">{t.admin.mineTitle}</h2>
        <Link to={href("planner")} className="btn btn--red">
          <Plus aria-hidden="true" /> {t.profile.startPlanning}
        </Link>
      </div>
      <p className="section__lead">{t.admin.mineLead}</p>
      {mine.data?.length ? (
        <ul className="ticket-grid">
          {mine.data.map((trip) => (
            <li key={trip.id}>
              <TripCard
                trip={trip}
                onDelete={remove}
                extra={
                  <button type="button" className="btn btn--ghost btn--small" onClick={() => void togglePublic(trip)} aria-label={trip.isPublic ? t.admin.unpublish(tripTitle(trip, lang)) : t.admin.publish(tripTitle(trip, lang))}>
                    {trip.isPublic ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />} {trip.isPublic ? t.admin.unpublishShort : t.admin.publishShort}
                  </button>
                }
              />
            </li>
          ))}
        </ul>
      ) : mine.isPending ? (
        <p className="loading-line">
          <span className="spinner" aria-hidden="true" /> {t.a11y.loading}
        </p>
      ) : (
        <p className="empty-state">{t.admin.mineEmpty}</p>
      )}
    </section>
  );
}

export default function Admin() {
  const t = useT();
  const lang = useLang();
  const href = useHref();
  const config = usePublicConfig();
  const navigate = useNavigate();
  const { user, ready, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const stats = useQuery({ queryKey: ["admin", "stats"], queryFn: api.admin.stats, enabled: Boolean(user?.isAdmin) });

  if (!mounted || !ready) {
    return (
      <div className="container page-head">
        <h1>{t.admin.title}</h1>
        <p className="loading-line">
          <span className="spinner" aria-hidden="true" /> {t.a11y.loading}
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container page-head">
        <h1>{t.admin.title}</h1>
        <p>{t.admin.needAdmin}</p>
        {config.data?.google ? (
          <p>
            <a className="btn btn--ghost google-btn" href={api.googleStartUrl(lang, href("admin"))}>
              <GoogleMark /> {t.auth.adminGoogle}
            </a>
          </p>
        ) : (
          <p className="field__hint">{t.auth.googleUnavailable}</p>
        )}
      </div>
    );
  }

  const figures = stats.data
    ? [
        { label: t.admin.trips, value: stats.data.trips },
        { label: t.admin.published, value: stats.data.publishedTrips },
        { label: t.admin.featured, value: stats.data.featuredTrips },
      ]
    : [];

  return (
    <>
      <div className="container page-head">
        <p className="eyebrow">
          <ShieldCheck aria-hidden="true" /> {user.email}
        </p>
        <h1>{t.admin.title}</h1>
        <p>{t.admin.lead}</p>
        <p className="button-row">
          <button
            type="button"
            className="btn btn--small btn--ghost"
            onClick={async () => {
              await logout();
              navigate(href("home"));
            }}
          >
            <LogOut aria-hidden="true" /> {t.nav.logout}
          </button>
        </p>
        {figures.length ? (
          <dl className="admin-stats" aria-label={t.admin.statsLabel}>
            {figures.map((f) => (
              <div key={f.label}>
                <dt>{f.label}</dt>
                <dd>{f.value.toLocaleString(DICTS[lang].locale)}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
      <div className="container profile-grid">
        <MyTrips />
        <TripsSection />
        <MapData />
      </div>
    </>
  );
}
