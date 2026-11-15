import "@fontsource/barlow-condensed/latin-600.css";
import "@fontsource/barlow-condensed/latin-700.css";
import "@fontsource/barlow-condensed/latin-800.css";
import "@fontsource/barlow-condensed/latin-ext-700.css";
import "@fontsource-variable/atkinson-hyperlegible-next/wght.css";
import "@fontsource/instrument-serif/latin-400-italic.css";
import "./app.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { I18nProvider, RouterProvider } from "react-aria-components";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useHref as useRouterHref,
  useLocation,
  useNavigate,
  useRouteError,
  type LinksFunction,
} from "react-router";
import { WifiOff } from "lucide-react";
import { FeedbackProvider } from "./components/Feedback";
import { InstallProvider } from "./components/Install";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { THEME_BOOTSTRAP } from "./components/ThemeToggle";
import { ToastProvider } from "./components/Toast";
import { DICTS, langFromPath, useLang, useT } from "./i18n";
import { AuthProvider } from "./lib/auth";
import { useOnline, useServiceWorker } from "./lib/pwa";

export const links: LinksFunction = () => [
  { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
  { rel: "icon", href: "/favicon-32.png", sizes: "32x32", type: "image/png" },
  { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
];

export function Layout({ children }: { children: ReactNode }) {
  const lang = langFromPath(useLocation().pathname);
  return (
    <html lang={lang} dir="ltr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#f4eee1" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#14171c" media="(prefers-color-scheme: dark)" />
        <meta name="color-scheme" content="light dark" />
        <meta name="author" content="Maxence Bonnici" />
        <link rel="manifest" href={lang === "en" ? "/manifest-en.webmanifest" : "/manifest.webmanifest"} />
        <meta name="apple-mobile-web-app-title" content="Epic Road Trip" />
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
        <Meta />
        <Links />
      </head>
      <body id="top">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

/** Offline notice (status message, WCAG 4.1.3); rendered after hydration only. */
function OfflineBanner() {
  const t = useT();
  const online = useOnline();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <div role="status" className="offline-banner-region">
      {mounted && !online ? (
        <p className="offline-banner">
          <WifiOff aria-hidden="true" /> {t.pwa.offline}
        </p>
      ) : null}
    </div>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const t = useT();
  return (
    <div className="app-shell">
      <div className="skip-links">
        <a href="#main">{t.a11y.skipToContent}</a>
      </div>
      <Header />
      <OfflineBanner />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <Footer />
    </div>
  );
}

/** After client-side navigation, move focus to the new page's heading (WCAG 2.4.3 / RGAA 12.7). */
function useRouteFocus() {
  const { pathname } = useLocation();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    document.documentElement.dataset.navigated = "true";
    const heading = document.querySelector<HTMLElement>("#main h1");
    if (heading) {
      if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
      heading.focus();
    }
  }, [pathname]);
}

export default function App() {
  const lang = useLang();
  const navigate = useNavigate();
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false } } }));
  useRouteFocus();
  useServiceWorker();

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider navigate={navigate} useHref={useRouterHref}>
        <I18nProvider locale={DICTS[lang].locale}>
          <ToastProvider>
            <AuthProvider>
              <FeedbackProvider>
                <InstallProvider>
                  <Shell>
                    <Outlet />
                  </Shell>
                </InstallProvider>
              </FeedbackProvider>
            </AuthProvider>
          </ToastProvider>
        </I18nProvider>
      </RouterProvider>
    </QueryClientProvider>
  );
}

export function HydrateFallback() {
  return (
    <div className="app-shell">
      <main id="main" className="container page-head">
        <p className="loading-line">
          <span className="spinner" aria-hidden="true" /> {DICTS.fr.a11y.loading}
        </p>
      </main>
    </div>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  const lang = langFromPath(typeof window === "undefined" ? "/" : window.location.pathname);
  const t = DICTS[lang];
  if (import.meta.env.DEV) console.error(error);
  const status = isRouteErrorResponse(error) ? error.status : 500;
  return (
    <div className="app-shell">
      <main id="main" className="container page-head">
        <p className="eyebrow">Erreur {status}</p>
        <h1>{t.errors.title}</h1>
        <p>{t.errors.text}</p>
        <button type="button" className="btn btn--red" onClick={() => window.location.reload()}>
          {t.errors.reload}
        </button>
      </main>
    </div>
  );
}
