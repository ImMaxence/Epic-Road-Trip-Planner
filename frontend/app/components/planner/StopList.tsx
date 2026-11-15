import { ChevronDown, ChevronUp, Plus, Search, X } from "lucide-react";
import { useState } from "react";
import { useLang, useT } from "../../i18n";
import type { Place, RouteResult } from "../../lib/api";
import { formatDuration, formatKm } from "../../lib/format";
import { Borne } from "../Borne";
import { PlaceCombo } from "../PlaceCombo";

interface StopListProps {
  from?: Place;
  to?: Place;
  via: (Place | undefined)[];
  route?: RouteResult;
  exploreIndex: number;
  onFrom: (p?: Place) => void;
  onTo: (p?: Place) => void;
  onVia: (index: number, p?: Place) => void;
  onAddVia: (p: Place) => void;
  onRemoveVia: (index: number) => void;
  onMoveVia: (index: number, direction: -1 | 1) => void;
  onExplore: (stopIndex: number) => void;
}

export const MAX_VIA = 12;

export function StopList(props: StopListProps) {
  const { from, to, via, route, exploreIndex, onFrom, onTo, onVia, onAddVia, onRemoveVia, onMoveVia, onExplore } = props;
  const t = useT();
  const lang = useLang();
  const [drafting, setDrafting] = useState(false);
  const stops = [from, ...via, to];
  const legs = route?.legs ?? [];

  const legText = (stopIndex: number) => {
    const leg = legs[stopIndex];
    if (!leg || !stops[stopIndex] || !stops[stopIndex + 1]) return null;
    return (
      <p className="stop__leg">
        <span className="visually-hidden">{stops[stopIndex + 1]!.name} : </span>
        {t.planner.leg(formatKm(leg.distanceKm, lang), formatDuration(leg.durationMin, lang))}
      </p>
    );
  };

  const exploreButton = (stopIndex: number, place?: Place) =>
    place ? (
      <button
        type="button"
        className={`btn btn--small ${exploreIndex === stopIndex ? "btn--yellow" : "btn--ghost"}`}
        aria-pressed={exploreIndex === stopIndex}
        onClick={() => onExplore(stopIndex)}
      >
        <Search aria-hidden="true" /> {t.planner.explore} {place.name}
      </button>
    ) : null;

  return (
    <ol className="stops">
      <li className="stop">
        <Borne label="A" tone="green" size={36} />
        <div className="stop__body">
          <PlaceCombo label={t.common.from} value={from} onChange={onFrom} isRequired />
          <div className="stop__actions">{exploreButton(0, from)}</div>
          {legText(0)}
        </div>
      </li>

      {via.map((place, i) => {
        const label = t.planner.stopLabel(i + 1);
        const name = place?.name ?? label;
        return (
          <li className="stop" key={`${place?.code ?? "empty"}-${i}`}>
            <Borne label={String(i + 1)} tone="red" size={36} />
            <div className="stop__body">
              <PlaceCombo label={label} value={place} onChange={(p) => onVia(i, p)} />
              <div className="stop__actions">
                {exploreButton(i + 1, place)}
                <span className="stop__order">
                  <button type="button" className="icon-btn icon-btn--small" onClick={() => onMoveVia(i, -1)} disabled={i === 0} aria-label={t.planner.moveUp(name)}>
                    <ChevronUp aria-hidden="true" />
                  </button>
                  <button type="button" className="icon-btn icon-btn--small" onClick={() => onMoveVia(i, 1)} disabled={i === via.length - 1} aria-label={t.planner.moveDown(name)}>
                    <ChevronDown aria-hidden="true" />
                  </button>
                  <button type="button" className="icon-btn icon-btn--small" onClick={() => onRemoveVia(i)} aria-label={t.planner.removeStop(name)}>
                    <X aria-hidden="true" />
                  </button>
                </span>
              </div>
              {legText(i + 1)}
            </div>
          </li>
        );
      })}

      <li className="stop stop--add">
        <span className="stop__add-dot" aria-hidden="true">
          <Plus />
        </span>
        <div className="stop__body">
          {drafting ? (
            <div className="stop__draft">
              <PlaceCombo
                label={t.planner.newStop}
                autoFocus
                onChange={(p) => {
                  if (p) {
                    onAddVia(p);
                    setDrafting(false);
                  }
                }}
              />
              <button type="button" className="btn btn--ghost btn--small" onClick={() => setDrafting(false)}>
                {t.common.cancel}
              </button>
            </div>
          ) : (
            <button type="button" className="btn btn--ghost btn--small" onClick={() => setDrafting(true)} disabled={via.length >= MAX_VIA}>
              <Plus aria-hidden="true" /> {t.planner.addStop}
            </button>
          )}
          {via.length >= MAX_VIA ? <p className="field__hint">{t.planner.maxStops}</p> : null}
        </div>
      </li>

      <li className="stop">
        <Borne label="B" tone="blue" size={36} />
        <div className="stop__body">
          <PlaceCombo label={t.common.to} value={to} onChange={onTo} isRequired />
          <div className="stop__actions">{exploreButton(stops.length - 1, to)}</div>
        </div>
      </li>
    </ol>
  );
}
