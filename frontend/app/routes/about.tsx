import { Link, type MetaFunction } from "react-router";
import { Borne } from "../components/Borne";
import { ExternalLink } from "../components/DocPage";
import { DICTS, langFromPath, useHref, useLang, useT } from "../i18n";
import { OWNER, REPO_URL } from "../lib/site";
import { breadcrumbLd, organizationLd, seo, webAppLd } from "../lib/seo";

export const meta: MetaFunction = ({ location }) => {
  const lang = langFromPath(location.pathname);
  const t = DICTS[lang];
  return seo({
    pathname: location.pathname,
    title: t.about.metaTitle,
    description: t.about.metaDescription,
    jsonLd: [breadcrumbLd(lang, "about", t.pages.about), { "@type": "AboutPage", name: t.about.title, about: { "@id": "https://tripplanner.mbonnici.fr/#app" } }, webAppLd(lang), organizationLd()],
  });
};

const TEAM = [
  {
    name: "Maxence Bonnici",
    photo: "/images/team/maxence-bonnici.webp",
    role: { fr: "Front-end, design et refonte 2026", en: "Front-end, design and 2026 redesign" },
    links: { site: OWNER.site, github: "https://github.com/ImMaxence", linkedin: "https://www.linkedin.com/in/maxence-bonnici-77b540250/" },
  },
  {
    name: "Maxence Laporte",
    photo: "/images/team/maxence-laporte.webp",
    role: { fr: "Back-end, traitement de données, documentation Swagger", en: "Back-end, data processing, Swagger documentation" },
    links: { github: "https://github.com/TheMaxquent", linkedin: "https://www.linkedin.com/in/maxence-laporte-391583230/" },
  },
  {
    name: "Meriem Boussaid",
    photo: "/images/team/meriem-boussaid.webp",
    role: { fr: "Développement et traitement des données", en: "Development and data processing" },
    links: { github: "https://github.com/boussaidm", linkedin: "https://www.linkedin.com/in/meriem-boussaid-571194220/" },
  },
  {
    name: "Federico Suarez",
    photo: "/images/team/federico-suarez.webp",
    role: { fr: "Développement web et sécurité applicative", en: "Web development and application security" },
    links: { github: "https://github.com/FedeSCode", linkedin: "https://www.linkedin.com/in/federico-suarez" },
  },
];

const STACK = ["React 19", "React Router 8", "TypeScript", "React Aria", "MapLibre GL", "Node.js 26", "Express 5", "Drizzle ORM", "MariaDB 11.8", "Python 3.14", "FastAPI", "SQLite", "OpenStreetMap", "OSRM", "Docker", "Coolify"];

export default function About() {
  const t = useT();
  const lang = useLang();
  const href = useHref();
  const fr = lang === "fr";

  return (
    <>
      <div className="container page-head">
        <h1>{t.about.title}</h1>
        <p>
          {fr
            ? "Epic Road Trip aide à préparer un road trip en France : on fixe un départ, une arrivée et des étapes, puis on découvre où manger, dormir et sortir à chaque arrêt."
            : "Epic Road Trip helps you prepare a road trip across France: set a start, a finish and a few stops, then discover where to eat, sleep and explore at every stop."}
        </p>
      </div>
      <div className="container profile-grid">
        <section aria-labelledby="story-title" className="prose">
          <h2 id="story-title">{fr ? "L'histoire" : "The story"}</h2>
          <ol className="timeline">
            <li>
              <Borne size={40} tone="green" label="24" />
              <div>
                <h3>{fr ? "2024 — un projet d'équipe à Epitech Marseille" : "2024 — a team project at Epitech Marseille"}</h3>
                <p>
                  {fr
                    ? "Quatre étudiants construisent la première version : une interface React, une API Node.js et un microservice Python qui exploite les données DataTourisme. Le cahier des charges : saisir plusieurs étapes, filtrer par dates, proposer hébergements, restaurants, bars, transports et événements, afficher le tout sur une carte, imprimer et partager le voyage."
                    : "Four students build the first version: a React interface, a Node.js API and a Python microservice using DataTourisme data. The brief: enter several stops, filter by dates, suggest places to stay, restaurants, bars, transport and events, show everything on a map, print and share the trip."}
                </p>
              </div>
            </li>
            <li>
              <Borne size={40} tone="red" label="26" />
              <div>
                <h3>{fr ? "2026 — la refonte complète" : "2026 — the full redesign"}</h3>
                <p>
                  {fr
                    ? "Nouvelle identité inspirée des atlas routiers et de la signalisation française, itinéraires réels en voiture, à vélo ou à pied, plusieurs centaines de milliers de lieux OpenStreetMap, partage par lien et QR code sans compte, application installable, version anglaise, pages légales, accessibilité RGAA et déploiement auto-hébergé."
                    : "A new identity inspired by road atlases and French road signs, real car, bike and walking routes, hundreds of thousands of OpenStreetMap places, sharing by link and QR code with no account, an installable app, an English version, legal pages, RGAA accessibility and self-hosted deployment."}
                </p>
              </div>
            </li>
          </ol>
        </section>

        <section aria-labelledby="team-title">
          <h2 id="team-title" style={{ fontSize: "var(--step-3)", textTransform: "uppercase" }}>{fr ? "L'équipe" : "The team"}</h2>
          <ul className="team">
            {TEAM.map((m) => (
              <li key={m.name} className="member">
                <img src={m.photo} alt={fr ? `Portrait de ${m.name}` : `Portrait of ${m.name}`} width={96} height={96} loading="lazy" />
                <h3>{m.name}</h3>
                <p>{m.role[lang]}</p>
                <p className="member__links">
                  <ExternalLink href={m.links.github}>
                    GitHub<span className="visually-hidden"> — {m.name}</span>
                  </ExternalLink>
                  <ExternalLink href={m.links.linkedin}>
                    LinkedIn<span className="visually-hidden"> — {m.name}</span>
                  </ExternalLink>
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="stack-title" className="prose">
          <h2 id="stack-title">{fr ? "Sous le capot" : "Under the hood"}</h2>
          <p>
            {fr
              ? "Trois services conteneurisés : une interface pré-rendue en français et en anglais, une API REST documentée (OpenAPI) et un service géographique qui indexe chaque mois l'extrait OpenStreetMap de la France. Le code est public, sous licence MIT."
              : "Three containerised services: a pre-rendered French and English interface, a documented REST API (OpenAPI) and a geo service that indexes the OpenStreetMap extract of France every month. The code is public, under the MIT License."}
          </p>
          <ul className="stack-list">
            {STACK.map((s) => <li key={s}>{s}</li>)}
          </ul>
          <p style={{ marginTop: "1.5rem" }}>
            <ExternalLink href={REPO_URL}>{fr ? "Voir le code source sur GitHub" : "View the source code on GitHub"}</ExternalLink> ·{" "}
            <a href="/api/docs/">{t.footer.apiDocs}</a> · <Link to={href("legal")}>{t.pages.legal}</Link>
          </p>
        </section>
      </div>
    </>
  );
}
