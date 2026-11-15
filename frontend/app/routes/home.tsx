import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Plus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button, Disclosure, DisclosurePanel, Heading } from "react-aria-components";
import { Link, useNavigate, type MetaFunction } from "react-router";
import { Borne } from "../components/Borne";
import { LazyDateRange as DateRange } from "../components/LazyDateRange";
import { PlaceCombo } from "../components/PlaceCombo";
import { TripCard, tripTitle } from "../components/TripCard";
import { DICTS, langFromPath, useHref, useLang, useT } from "../i18n";
import { api, type Place, type TripSummary } from "../lib/api";
import { writeParams } from "../lib/planner-state";
import { organizationLd, seo, webAppLd } from "../lib/seo";

export const meta: MetaFunction = ({ location }) => {
  const lang = langFromPath(location.pathname);
  const t = DICTS[lang];
  return seo({
    pathname: location.pathname,
    title: t.home.metaTitle,
    description: t.home.metaDescription,
    jsonLd: [
      webAppLd(lang),
      organizationLd(),
      {
        "@type": "FAQPage",
        mainEntity: t.home.faq.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
    ],
  });
};

const SIGN_TONES = ["green", "blue", "brown", "white", "green", "blue"] as const;

function Signpost({ trips }: { trips: TripSummary[] }) {
  const t = useT();
  const lang = useLang();
  const href = useHref();
  return (
    <div className="signpost">
      <h2 className="visually-hidden" id="signpost-title">
        {t.home.signpostLabel}
      </h2>
      <div className="signpost__pole" aria-hidden="true" />
      <ul className="signpost__list" aria-labelledby="signpost-title">
        {trips.slice(0, 6).map((trip, i) => (
          <li key={trip.id}>
            <Link
              to={`${href("planner")}?trip=${trip.id}`}
              className={`arrow-sign arrow-sign--${SIGN_TONES[i]} ${i % 2 ? "arrow-sign--left" : ""}`}
            >
              <span className="arrow-sign__name">
                {trip.to.name} <small>{tripTitle(trip, lang)}</small>
              </span>{" "}
              <span className="arrow-sign__km">
                {trip.distanceKm ?? "—"}
                <span className="visually-hidden"> km</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="signpost__borne" aria-hidden="true">
        <Borne size={64} tone="red" cap="N7" label="PK 0" />
      </div>
      <p className="signpost__caption" aria-hidden="true">
        {lang === "fr" ? "« La route des vacances »" : "“The holiday road”"}
      </p>
    </div>
  );
}

function TripForm() {
  const t = useT();
  const href = useHref();
  const navigate = useNavigate();
  const [from, setFrom] = useState<Place>();
  const [to, setTo] = useState<Place>();
  const [dates, setDates] = useState<{ start?: string; end?: string }>({});
  const [error, setError] = useState(false);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!from || !to) {
      setError(true);
      return;
    }
    navigate(`${href("planner")}${writeParams({ from: from.code, to: to.code, start: dates.start, end: dates.end })}`);
  };

  return (
    <form className="sign-panel trip-form" onSubmit={submit} noValidate aria-labelledby="trip-form-title">
      <div className="sign-panel__inner">
        <h2 id="trip-form-title">
          <span className="route-badge">A</span> {t.home.formTitle}
        </h2>
        <div className="trip-form__grid">
          <PlaceCombo label={t.common.from} value={from} onChange={setFrom} isRequired errorMessage={error && !from ? t.home.formError : undefined} />
          <PlaceCombo label={t.common.to} value={to} onChange={setTo} isRequired errorMessage={error && !to ? t.home.formError : undefined} />
          <div className="field--wide">
            <DateRange label={t.common.dates} start={dates.start} end={dates.end} onChange={setDates} optional />
          </div>
        </div>
        <div className="trip-form__actions">
          <button type="submit" className="btn btn--yellow btn--lg">
            {t.home.submit} <ArrowRight aria-hidden="true" />
          </button>
        </div>
      </div>
    </form>
  );
}

export default function Home() {
  const t = useT();
  const href = useHref();
  const featured = useQuery({ queryKey: ["trips", "featured"], queryFn: () => api.trips({ featured: true, limit: 6, sort: "oldest" }) });
  const trips = featured.data?.items ?? [];

  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="container hero__grid">
          <div>
            <p className="eyebrow hero__eyebrow">
              <span className="route-badge route-badge--yellow" aria-hidden="true">
                D
              </span>
              {t.home.eyebrow}
            </p>
            <h1 id="hero-title">
              <span className="hero__top">{t.home.titleTop}</span>
              <span className="hero__bottom">{t.home.titleBottom}</span>
            </h1>
            <p className="hero__lead">{t.home.lead}</p>
            <TripForm />
          </div>
          {trips.length ? <Signpost trips={trips} /> : <div className="signpost" aria-hidden="true"><div className="signpost__pole" /></div>}
        </div>
      </section>

      <section className="section" aria-labelledby="how-title">
        <div className="container">
          <div className="section__head">
            <h2 id="how-title">{t.home.howTitle}</h2>
          </div>
          <ol className="steps">
            {t.home.how.map((step, i) => (
              <li key={step.title}>
                <Borne size={56} tone={i === 0 ? "green" : i === 2 ? "blue" : "red"} label={String(i + 1)} />
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section" aria-labelledby="featured-title">
        <div className="container">
          <div className="section__head">
            <div>
              <h2 id="featured-title">{t.home.featuredTitle}</h2>
              <p>{t.home.featuredLead}</p>
            </div>
            <Link to={href("trips")} className="btn btn--ghost">
              {t.common.seeAll} <ArrowRight aria-hidden="true" />
            </Link>
          </div>
          {featured.isError ? (
            <p className="notice notice--error">{t.trips.error}</p>
          ) : trips.length ? (
            <ul className="ticket-grid">
              {trips.map((trip) => (
                <li key={trip.id}>
                  <TripCard trip={trip} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="loading-line">
              <span className="spinner" aria-hidden="true" /> {t.a11y.loading}
            </p>
          )}
        </div>
      </section>

      <section className="section" aria-labelledby="features-title">
        <div className="container">
          <div className="section__head">
            <h2 id="features-title">{t.home.featuresTitle}</h2>
          </div>
          <ul className="feature-grid">
            {t.home.features.map((f) => (
              <li key={f.title} className={`feature feature--${f.tone}`}>
                <div className="feature__inner">
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section" aria-labelledby="faq-title">
        <div className="container faq-layout">
          <div className="section__head">
            <h2 id="faq-title">{t.home.faqTitle}</h2>
          </div>
          <div className="faq">
            {t.home.faq.map((item) => (
              <Disclosure key={item.q} className="faq-item">
                <Heading level={3}>
                  <Button slot="trigger">
                    {item.q}
                    <Plus aria-hidden="true" />
                  </Button>
                </Heading>
                <DisclosurePanel>
                  <div className="faq-panel">
                    <p>{item.a}</p>
                  </div>
                </DisclosurePanel>
              </Disclosure>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-band" aria-labelledby="cta-title">
        <div className="container">
          <div>
            <h2 id="cta-title">{t.home.ctaTitle}</h2>
            <p>{t.home.ctaText}</p>
          </div>
          <Link to={href("planner")} className="btn btn--lg">
            {t.home.ctaButton} <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  );
}
