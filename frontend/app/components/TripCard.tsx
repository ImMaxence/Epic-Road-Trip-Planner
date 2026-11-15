import { ArrowRight, Heart, Lock, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { useHref, useLang, useT } from "../i18n";
import type { TripSummary } from "../lib/api";
import { localStore, useLocalFavorites } from "../lib/local-store";
import { formatKm } from "../lib/format";
import { CoverArt } from "./CoverArt";
import { useToast } from "./Toast";

export const tripTitle = (trip: Pick<TripSummary, "title" | "titles">, lang: "fr" | "en") => trip.titles?.[lang] ?? trip.title;

interface TripCardProps {
  trip: TripSummary;
  headingLevel?: 2 | 3;
  onDelete?: (trip: TripSummary) => void;
  extra?: ReactNode;
  /** Link target override (trips saved on this device open with ?local=…). */
  href?: string;
}

export function TripCard({ trip, headingLevel = 3, onDelete, extra, href: linkOverride }: TripCardProps) {
  const t = useT();
  const lang = useLang();
  const href = useHref();
  const toast = useToast();
  // Favourites are kept on this device (no account needed).
  const favorite = useLocalFavorites().includes(trip.id);
  const title = tripTitle(trip, lang);
  const Heading = headingLevel === 2 ? "h2" : "h3";

  return (
    <article className="ticket">
      <div className="ticket__cover">
        <CoverArt cover={trip.cover} />
        <div className="ticket__badges">
          {trip.featured ? <span className="stamp">{t.common.teamPick}</span> : null}
          {!trip.isPublic ? (
            <span className="badge">
              <Lock width={14} height={14} aria-hidden="true" /> {t.common.private}
            </span>
          ) : null}
        </div>
      </div>
      {trip.isPublic ? (
        <button
          type="button"
          className="icon-btn ticket__fav"
          aria-pressed={favorite}
          aria-label={favorite ? t.trips.unfavorite(title) : t.trips.favorite(title)}
          onClick={() => {
            if (!localStore.toggleFavorite(trip.id, !favorite)) toast(t.planner.saveLocalFailed, "error");
          }}
        >
          <Heart aria-hidden="true" />
        </button>
      ) : null}
      <div className="ticket__perf" aria-hidden="true" />
      <div className="ticket__body">
        <Heading className="ticket__route">
          <Link to={linkOverride ?? `${href("planner")}?trip=${trip.id}`}>
            {trip.from.name} <ArrowRight width={20} height={20} aria-hidden="true" style={{ display: "inline", verticalAlign: "-2px" }} /> {trip.to.name}
            <span className="visually-hidden"> — {title}</span>
          </Link>
        </Heading>
        <p className="ticket__title">{title}</p>
        {trip.via.length ? (
          <p className="ticket__via">
            {t.trips.via} {trip.via.slice(0, 4).join(", ")}
            {trip.via.length > 4 ? "…" : ""}
          </p>
        ) : null}
        {trip.summary?.[lang] ? <p className="ticket__via">{trip.summary[lang]}</p> : null}
        <dl className="ticket__stats">
          <div>
            <dt>{t.planner.summaryDistance}</dt>
            <dd>{formatKm(trip.distanceKm, lang)}</dd>
          </div>
          <div>
            <dt>{t.common.stops}</dt>
            <dd>{trip.stopCount + 2}</dd>
          </div>
          <div>
            <dt>{t.common.by}</dt>
            <dd>{trip.author.name}</dd>
          </div>
        </dl>
        {onDelete || extra ? (
          <div className="ticket__owner">
            {onDelete ? (
              <button type="button" className="btn btn--ghost btn--small" onClick={() => onDelete(trip)} aria-label={t.profile.deleteTrip(title)}>
                <Trash2 aria-hidden="true" /> {t.common.delete}
              </button>
            ) : null}
            {extra}
          </div>
        ) : null}
      </div>
    </article>
  );
}
