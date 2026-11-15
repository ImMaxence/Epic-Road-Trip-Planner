import { lazy, Suspense } from "react";
import type { MetaFunction } from "react-router";
import { DICTS, langFromPath, useT } from "../i18n";
import { useHydrated } from "../lib/hooks";
import { breadcrumbLd, seo } from "../lib/seo";

export const meta: MetaFunction = ({ location }) => {
  const lang = langFromPath(location.pathname);
  const t = DICTS[lang];
  return seo({ pathname: location.pathname, title: t.planner.metaTitle, description: t.planner.metaDescription, jsonLd: [breadcrumbLd(lang, "planner", t.pages.planner)] });
};

// MapLibre and the planner only run in the browser; the pre-rendered page ships a light shell.
const Planner = lazy(() => import("../components/planner/Planner").then((m) => ({ default: m.Planner })));

function Shell() {
  const t = useT();
  return (
    <div className="planner planner--shell">
      <section className="planner__panel">
        <header className="planner__head">
          <p className="eyebrow">{t.brand.name}</p>
          <h1>{t.planner.title}</h1>
          <p className="muted">{t.planner.metaDescription}</p>
          <p className="loading-line">
            <span className="spinner" aria-hidden="true" /> {t.a11y.loading}
          </p>
        </header>
      </section>
      <div className="planner__map" aria-hidden="true" />
    </div>
  );
}

export default function PlannerRoute() {
  const hydrated = useHydrated();
  if (!hydrated) return <Shell />;
  return (
    <Suspense fallback={<Shell />}>
      <Planner />
    </Suspense>
  );
}
