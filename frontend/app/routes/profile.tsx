import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Info, Plus, ShieldCheck, Smartphone, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, type MetaFunction } from "react-router";
import { useInstall } from "../components/Install";
import { useToast } from "../components/Toast";
import { TripCard } from "../components/TripCard";
import { DICTS, langFromPath, useHref, useLang, useT } from "../i18n";
import { api, type TripSummary } from "../lib/api";
import { useAuth } from "../lib/auth";
import { downloadText, localStore, useLocalFavorites, useLocalTrips, type LocalTrip } from "../lib/local-store";
import { seo } from "../lib/seo";

export const meta: MetaFunction = ({ location }) => {
  const t = DICTS[langFromPath(location.pathname)];
  return seo({ pathname: location.pathname, title: t.profile.metaTitle, noindex: true });
};

/** Adapts a trip saved in this browser to the ticket card. */
function localSummary(trip: LocalTrip): TripSummary {
  return {
    id: 0,
    title: trip.title,
    cover: trip.cover,
    isPublic: false,
    featured: false,
    author: { id: null, name: "—" },
    from: { code: trip.plan.from.code, name: trip.plan.from.name },
    to: { code: trip.plan.to.code, name: trip.plan.to.name },
    via: trip.plan.via.map((p) => p.name),
    stopCount: trip.plan.via.length,
    distanceKm: trip.plan.distanceKm != null ? Math.round(trip.plan.distanceKm) : null,
    startDate: trip.plan.startDate ?? null,
    endDate: trip.plan.endDate ?? null,
    createdAt: trip.createdAt,
    isOwner: true,
  };
}

/** Administrators can move trips saved on this device to the server, to publish them. */
function UploadToServer() {
  const t = useT();
  const toast = useToast();
  const client = useQueryClient();
  const trips = useLocalTrips();
  const [busy, setBusy] = useState(false);
  if (!trips.length) return null;

  const run = async () => {
    setBusy(true);
    let done = 0;
    for (const trip of trips) {
      try {
        await api.createTrip({ title: trip.title, cover: trip.cover, isPublic: false, plan: trip.plan });
        localStore.deleteTrip(trip.id);
        done++;
      } catch {
        /* keep it locally and carry on */
      }
    }
    setBusy(false);
    toast(t.profile.imported(done), done ? "success" : "error");
    void client.invalidateQueries({ queryKey: ["my-trips"] });
  };

  return (
    <button type="button" className="btn" onClick={() => void run()} disabled={busy}>
      <Upload aria-hidden="true" /> {t.profile.uploadToServer(trips.length)}
    </button>
  );
}

/** "My space": everything a visitor saved, kept in this browser only. */
export default function Profile() {
  const t = useT();
  const lang = useLang();
  const href = useHref();
  const toast = useToast();
  const { user } = useAuth();
  const trips = useLocalTrips();
  const favoriteIds = useLocalFavorites();
  const fileInput = useRef<HTMLInputElement>(null);
  const install = useInstall();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const favorites = useQuery({
    queryKey: ["trips", "favorites", favoriteIds],
    queryFn: () => api.trips({ ids: favoriteIds.slice(-48), limit: 48 }).then((r) => r.items),
    enabled: favoriteIds.length > 0,
  });

  const importFile = async (file: File | undefined) => {
    if (!file) return;
    const result = file.size < 2_000_000 ? localStore.importJson(await file.text()) : null;
    toast(result ? t.profile.importDone(result.trips, result.favorites) : t.profile.importFailed, result ? "success" : "error");
    if (fileInput.current) fileInput.current.value = "";
  };

  if (!mounted) {
    return (
      <div className="container page-head">
        <h1>{t.profile.title}</h1>
        <p className="loading-line">
          <span className="spinner" aria-hidden="true" /> {t.a11y.loading}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="container page-head">
        <h1>{t.profile.title}</h1>
        <p>{t.profile.localLead}</p>
        {user ? (
          <div className="notice notice--info info-banner">
            <ShieldCheck aria-hidden="true" />
            <div>
              <p>{t.profile.adminBanner(user.username)}</p>
              <p className="button-row">
                <Link className="btn btn--small btn--red" to={href("admin")}>
                  {t.profile.adminLink}
                </Link>
                <UploadToServer />
              </p>
            </div>
          </div>
        ) : null}
      </div>
      <div className="container profile-grid">
        <section aria-labelledby="local-trips-title">
          <div className="section__head" style={{ marginBottom: "1.5rem" }}>
            <h2 id="local-trips-title">{t.profile.localTrips}</h2>
            <Link to={href("planner")} className="btn btn--red">
              <Plus aria-hidden="true" /> {t.profile.startPlanning}
            </Link>
          </div>
          {trips.length ? (
            <ul className="ticket-grid">
              {trips.map((trip) => (
                <li key={trip.id}>
                  <TripCard
                    trip={localSummary(trip)}
                    href={`${href("planner")}?local=${trip.id}`}
                    onDelete={() => {
                      if (!window.confirm(t.profile.deleteTripConfirm(trip.title))) return;
                      localStore.deleteTrip(trip.id);
                      toast(t.profile.tripDeleted);
                    }}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-state">{t.profile.localTripsEmpty}</p>
          )}
        </section>

        <section aria-labelledby="local-favorites-title">
          <h2 id="local-favorites-title" style={{ fontSize: "var(--step-3)", textTransform: "uppercase" }}>
            {t.profile.localFavorites}
          </h2>
          {favoriteIds.length && favorites.data?.length ? (
            <ul className="ticket-grid">
              {favorites.data.map((trip) => (
                <li key={trip.id}>
                  <TripCard trip={trip} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-state">{t.profile.favoritesEmpty}</p>
          )}
        </section>

        <section className="panel" aria-labelledby="local-data-title">
          <h2 id="local-data-title">{t.profile.localTitle}</h2>
          <div className="notice notice--info">
            <Info aria-hidden="true" />
            <div>
              <p>{t.profile.devicesText}</p>
            </div>
          </div>
          <div className="button-row">
            <button type="button" className="btn" onClick={() => downloadText(`epic-road-trip-${lang}-${new Date().toISOString().slice(0, 10)}.json`, localStore.exportJson())}>
              <Download aria-hidden="true" /> {t.profile.localExport}
            </button>
            <button type="button" className="btn" onClick={() => fileInput.current?.click()}>
              <Upload aria-hidden="true" /> {t.profile.localImport}
            </button>
            {install.available ? (
              <button type="button" className="btn" onClick={install.start}>
                <Smartphone aria-hidden="true" /> {t.pwa.install}
              </button>
            ) : null}
            <input ref={fileInput} type="file" accept="application/json,.json" hidden aria-hidden="true" tabIndex={-1} onChange={(e) => void importFile(e.target.files?.[0])} />
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                if (!window.confirm(t.profile.localClearConfirm)) return;
                localStore.clear();
                toast(t.profile.localCleared);
              }}
            >
              {t.profile.localClear}
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
