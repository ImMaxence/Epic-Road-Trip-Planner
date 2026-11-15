import { ArrowUp, Download, MessageSquareText } from "lucide-react";
import { Link } from "react-router";
import { useHref, useT } from "../i18n";
import { APP_VERSION, OWNER, REPO_URL } from "../lib/site";
import { Brand } from "./Brand";
import { useFeedback } from "./Feedback";
import { useInstall } from "./Install";

export function Footer() {
  const t = useT();
  const href = useHref();
  const openFeedback = useFeedback();
  const install = useInstall();
  return (
    <footer className="site-footer">
      <div className="road-divider" aria-hidden="true" />
      <div className="container">
        <div className="site-footer__grid">
          <div className="site-footer__brand">
            <Brand showTagline={false} />
            <p>{t.footer.about}</p>
          </div>
          <nav aria-labelledby="footer-explore">
            <h2 id="footer-explore">{t.footer.explore}</h2>
            <ul>
              <li><Link to={href("planner")}>{t.nav.planner}</Link></li>
              <li><Link to={href("trips")}>{t.nav.trips}</Link></li>
              <li><Link to={href("about")}>{t.nav.about}</Link></li>
              <li><Link to={href("sitemap")}>{t.sitemap.title}</Link></li>
            </ul>
          </nav>
          <nav aria-labelledby="footer-legal">
            <h2 id="footer-legal">{t.footer.legal}</h2>
            <ul>
              <li><Link to={href("legal")}>{t.pages.legal}</Link></li>
              <li><Link to={href("privacy")}>{t.pages.privacy}</Link></li>
              <li><Link to={href("terms")}>{t.pages.terms}</Link></li>
              <li><Link to={href("accessibility")}>{t.footer.accessibility}</Link></li>
            </ul>
          </nav>
          <div>
            <h2 id="footer-project">{t.footer.project}</h2>
            <ul aria-labelledby="footer-project">
              <li>
                <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
                  {t.footer.sourceCode} <span className="visually-hidden">{t.a11y.externalLink}</span>
                </a>
              </li>
              <li><a href="/api/docs/">{t.footer.apiDocs}</a></li>
              <li><Link to={href("login")}>{t.nav.admin}</Link></li>
              <li>
                <button type="button" className="link-btn" onClick={openFeedback}>
                  <MessageSquareText aria-hidden="true" /> {t.feedback.button}
                </button>
              </li>
              {install.available ? (
                <li>
                  <button type="button" className="link-btn" onClick={install.start}>
                    <Download aria-hidden="true" /> {t.pwa.install}
                  </button>
                </li>
              ) : null}
              <li>
                <a href={OWNER.contact} target="_blank" rel="noopener noreferrer">
                  Contact <span className="visually-hidden">{t.a11y.externalLink}</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="site-footer__bottom">
          <p>
            © 2024–2026 · {t.footer.madeBy}{" "}
            <a href={OWNER.site} target="_blank" rel="noopener noreferrer">
              {OWNER.name} <span className="visually-hidden">{t.a11y.externalLink}</span>
            </a>{" "}
            · {t.footer.version} {APP_VERSION}
          </p>
          <p>{t.footer.credits}</p>
          <a href="#top" className="btn btn--ghost btn--small" style={{ color: "inherit", borderColor: "rgb(241 235 221 / .4)" }}>
            <ArrowUp aria-hidden="true" /> {t.footer.backToTop}
          </a>
        </div>
      </div>
    </footer>
  );
}
