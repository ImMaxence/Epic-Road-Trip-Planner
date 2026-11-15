import { Link, type MetaFunction } from "react-router";
import { DICTS, langFromPath, useHref, useT } from "../i18n";
import { seo } from "../lib/seo";

export const meta: MetaFunction = ({ location }) => {
  const t = DICTS[langFromPath(location.pathname)];
  return seo({ pathname: location.pathname, title: t.notFound.metaTitle, noindex: true });
};

export default function NotFound() {
  const t = useT();
  const href = useHref();
  return (
    <div className="container road-closed">
      <div className="road-closed__sign" aria-hidden="true">
        <div>{t.notFound.sign}</div>
      </div>
      <div className="road-closed__barrier" aria-hidden="true" />
      <h1>{t.notFound.title}</h1>
      <p>{t.notFound.text}</p>
      <nav className="road-closed__links" aria-label={t.notFound.text}>
        <Link className="btn btn--red" to={href("home")}>{t.notFound.home}</Link>
        <Link className="btn btn--ghost" to={href("planner")}>{t.notFound.planner}</Link>
        <Link className="btn btn--ghost" to={href("sitemap")}>{t.notFound.sitemap}</Link>
      </nav>
    </div>
  );
}
