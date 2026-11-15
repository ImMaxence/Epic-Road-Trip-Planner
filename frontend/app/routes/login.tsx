import { ShieldCheck } from "lucide-react";
import { Link, Navigate, useSearchParams, type MetaFunction } from "react-router";
import { Borne } from "../components/Borne";
import { GoogleMark } from "../components/GoogleMark";
import { DICTS, langFromPath, useHref, useLang, useT } from "../i18n";
import { api } from "../lib/api";
import { useAuth, usePublicConfig } from "../lib/auth";
import { safeNext } from "../lib/auth-utils";
import { seo } from "../lib/seo";

export const meta: MetaFunction = ({ location }) => {
  const t = DICTS[langFromPath(location.pathname)];
  return seo({ pathname: location.pathname, title: t.auth.loginMetaTitle, noindex: true });
};

/** Administrator sign-in (Google). Visitors have no account and never need this page. */
export default function Login() {
  const t = useT();
  const lang = useLang();
  const href = useHref();
  const [params] = useSearchParams();
  const { user, ready } = useAuth();
  const config = usePublicConfig();
  const next = safeNext(params.get("next"));
  const error = params.get("error");

  if (ready && user) return <Navigate to={next ?? href("admin")} replace />;

  return (
    <div className="container auth">
      <div className="sign-panel sign-panel--blue auth__card">
        <div className="sign-panel__inner">
          <Borne size={44} tone="yellow" label="★" />
          <h1>{t.auth.loginTitle}</h1>
          <p className="lead">{t.auth.loginLead}</p>
          {error ? (
            <p className="notice notice--error auth__error" role="alert">
              {t.auth.errors[error] ?? t.auth.errors.generic}
            </p>
          ) : null}
          <section className="auth-option" aria-labelledby="admin-title">
            <h2 id="admin-title">
              <ShieldCheck aria-hidden="true" /> {t.auth.adminTitle}
            </h2>
            <p>{t.auth.adminText}</p>
            {config.data?.google ? (
              <a className="btn btn--ghost btn--block btn--lg google-btn" href={api.googleStartUrl(lang, next)}>
                <GoogleMark /> {t.auth.adminGoogle}
              </a>
            ) : (
              <p className="field__hint">{config.isPending ? t.a11y.loading : t.auth.googleUnavailable}</p>
            )}
          </section>
          <section className="auth-option" aria-labelledby="visitor-title">
            <h2 id="visitor-title">{t.auth.visitorTitle}</h2>
            <p>{t.auth.visitorText}</p>
            <Link className="btn btn--yellow btn--block" to={href("planner")}>
              {t.nav.planner}
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
