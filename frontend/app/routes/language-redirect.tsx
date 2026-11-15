import { useEffect } from "react";
import { Link, useNavigate, type MetaFunction } from "react-router";

// In production nginx answers "/" with a 302 based on Accept-Language; this covers dev and direct SPA hits.
export const meta: MetaFunction = () => [{ title: "Epic Road Trip" }, { name: "robots", content: "noindex, follow" }];

export default function LanguageRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    const preferred = navigator.languages?.find((l) => /^(fr|en)/i.test(l)) ?? "fr";
    navigate(/^en/i.test(preferred) ? "/en" : "/fr", { replace: true });
  }, [navigate]);
  return (
    <div className="container page-head">
      <h1>Epic Road Trip</h1>
      <p>
        <Link to="/fr" hrefLang="fr" lang="fr">Français</Link> · <Link to="/en" hrefLang="en" lang="en">English</Link>
      </p>
    </div>
  );
}
