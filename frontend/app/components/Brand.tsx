import { Link } from "react-router";
import { useHref, useT } from "../i18n";
import { Borne } from "./Borne";

export function BrandMark({ size = 30 }: { size?: number }) {
  return <Borne size={size} tone="red" className="brand__mark" />;
}

export function Brand({ showTagline = true }: { showTagline?: boolean }) {
  const t = useT();
  const href = useHref();
  return (
    // The accessible name starts with the visible wordmark (WCAG 2.5.3 Label in Name).
    <Link to={href("home")} className="brand">
      <BrandMark />
      <span className="brand__word">
        Epic Road <span>Trip</span>
        {showTagline ? <span className="brand__sub"> {t.brand.tagline}</span> : null}
        <span className="visually-hidden"> — {t.pages.home}</span>
      </span>
    </Link>
  );
}
