import { Link, type MetaFunction } from "react-router";
import { DICTS, langFromPath, path, ROUTES, useLang, useT, type RouteKey } from "../i18n";
import { breadcrumbLd, seo } from "../lib/seo";

export const meta: MetaFunction = ({ location }) => {
  const lang = langFromPath(location.pathname);
  const t = DICTS[lang];
  return seo({ pathname: location.pathname, title: t.sitemap.metaTitle, description: t.sitemap.metaDescription, jsonLd: [breadcrumbLd(lang, "sitemap", t.sitemap.title)] });
};

const GROUPS: { fr: string; en: string; keys: RouteKey[] }[] = [
  { fr: "Planifier", en: "Plan", keys: ["home", "planner", "trips", "about"] },
  { fr: "Mon espace", en: "My space", keys: ["profile"] },
  { fr: "Informations légales", en: "Legal information", keys: ["legal", "privacy", "terms", "accessibility", "sitemap"] },
];

export default function Sitemap() {
  const t = useT();
  const lang = useLang();
  const other = lang === "fr" ? "en" : "fr";
  return (
    <>
      <div className="container page-head">
        <h1>{t.sitemap.title}</h1>
      </div>
      <div className="container sitemap-list prose">
        {GROUPS.map((g) => (
          <section key={g.fr} aria-labelledby={`g-${g.en}`}>
            <h2 id={`g-${g.en}`}>{g[lang]}</h2>
            <ul>
              {g.keys.map((k) => (
                <li key={k}>
                  <Link to={path(k, lang)}>{t.pages[k]}</Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
        <section aria-labelledby="g-other" lang={other}>
          <h2 id="g-other">{DICTS[other].sitemap.title} ({other.toUpperCase()})</h2>
          <ul>
            {(Object.keys(ROUTES) as RouteKey[]).filter((k) => k !== "admin" && k !== "login").map((k) => (
              <li key={k}>
                <Link to={path(k, other)} hrefLang={other}>
                  {DICTS[other].pages[k]}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
