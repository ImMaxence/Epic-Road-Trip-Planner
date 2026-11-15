import { useLang, useT } from "../../i18n";
import type { Pin, Place, RouteResult, TravelMode } from "../../lib/api";
import { daysBetween, formatDate, formatDuration, formatKm } from "../../lib/format";

interface PrintSheetProps {
  title: string;
  stops: Place[];
  route?: RouteResult;
  pins: Pin[];
  start?: string;
  end?: string;
  mode: TravelMode;
  snapshot: string | null;
}

/** Paper road book, only visible when printing (or "Save as PDF"). */
export function PrintSheet({ title, stops, route, pins, start, end, mode, snapshot }: PrintSheetProps) {
  const t = useT();
  const lang = useLang();
  const days = daysBetween(start, end);
  return (
    <section className="print-sheet" aria-hidden="true">
      <header className="print-sheet__head">
        <p className="print-sheet__brand">Epic Road Trip · {t.planner.printTitle}</p>
        <h2>{title}</h2>
        <p>
          {start && end ? `${formatDate(start, lang)} → ${formatDate(end, lang)}${days ? ` · ${t.common.daysCount(days)}` : ""} · ` : ""}
          {route ? `${formatKm(route.distanceKm, lang)} · ${formatDuration(route.durationMin, lang)}` : ""} · {t.common.stopsCount(stops.length)} · {t.planner.modes[mode]}
        </p>
      </header>
      {snapshot ? <img className="print-sheet__map" src={snapshot} alt="" /> : <p>{t.planner.printNoMap}</p>}
      <table className="print-sheet__table">
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">{t.common.stops}</th>
            <th scope="col">{t.planner.summaryDistance}</th>
            <th scope="col">{t.planner.summaryDuration}</th>
          </tr>
        </thead>
        <tbody>
          {stops.map((stop, i) => {
            const leg = i > 0 ? route?.legs[i - 1] : undefined;
            const stopPins = pins.filter((p) => p.stop === i);
            return (
              <tr key={`${stop.code}-${i}`}>
                <td>{i === 0 ? "A" : i === stops.length - 1 ? "B" : i}</td>
                <td>
                  <strong>{stop.name}</strong> ({stop.departmentCode})
                  {stopPins.length ? (
                    <ul>
                      {stopPins.map((p) => (
                        <li key={p.id}>
                          {p.name} — {p.kind ? (t.kinds[p.kind] ?? p.kind) : t.categories[p.category]}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </td>
                <td>{leg ? formatKm(leg.distanceKm, lang) : "—"}</td>
                <td>{leg ? formatDuration(leg.durationMin, lang) : "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="print-sheet__foot">
        {t.planner.printGenerated(formatDate(new Date().toISOString(), lang))} · © OpenStreetMap · OpenFreeMap
      </p>
    </section>
  );
}
