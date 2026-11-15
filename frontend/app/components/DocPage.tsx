import type { ReactNode } from "react";
import { useLang, useT } from "../i18n";
import { formatDate } from "../lib/format";
import { LEGAL_UPDATED } from "../lib/site";

export interface DocSection {
  id: string;
  title: string;
  body: ReactNode;
}

/** Long-form page (legal texts, statements) with a table of contents. */
export function DocPage({ title, intro, sections, updated = LEGAL_UPDATED }: { title: string; intro?: ReactNode; sections: DocSection[]; updated?: string }) {
  const t = useT();
  const lang = useLang();
  return (
    <>
      <div className="container page-head">
        <h1>{title}</h1>
        {intro}
      </div>
      <div className="container doc">
        <nav className="doc__toc" aria-labelledby="toc-title">
          <h2 id="toc-title">{t.legal.toc}</h2>
          <ol>
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`}>{s.title}</a>
              </li>
            ))}
          </ol>
        </nav>
        <article className="prose">
          <p className="doc__meta">{t.legal.updated(formatDate(updated, lang))}</p>
          {sections.map((s) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-title`}>
              <h2 id={`${s.id}-title`}>{s.title}</h2>
              {s.body}
            </section>
          ))}
        </article>
      </div>
    </>
  );
}

export function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  const t = useT();
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <span className="visually-hidden"> {t.a11y.externalLink}</span>
    </a>
  );
}
