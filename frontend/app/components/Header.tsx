import { Download, Globe, LogOut, Menu as MenuIcon, MessageSquareText, ShieldCheck, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, Menu, MenuItem, MenuTrigger, Popover } from "react-aria-components";
import { Link, NavLink, useLocation, useNavigate } from "react-router";
import { alternatePath, useHref, useLang, useT } from "../i18n";
import { useAuth } from "../lib/auth";
import { Brand } from "./Brand";
import { useFeedback } from "./Feedback";
import { useInstall } from "./Install";
import { ThemeToggle } from "./ThemeToggle";
import { useToast } from "./Toast";

export function Header() {
  const t = useT();
  const lang = useLang();
  const href = useHref();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const { user, logout } = useAuth();
  const openFeedback = useFeedback();
  const install = useInstall();
  const [open, setOpen] = useState(false);
  const other = lang === "fr" ? "en" : "fr";

  useEffect(() => setOpen(false), [location.pathname]);

  const links = [
    { to: href("planner"), label: t.nav.planner },
    { to: href("trips"), label: t.nav.trips },
    { to: href("about"), label: t.nav.about },
  ];

  const signOut = async () => {
    await logout();
    toast(t.nav.logout);
    navigate(href("home"));
  };

  const langLink = (
    <Link
      className="btn btn--ghost btn--small lang-switch"
      to={alternatePath(location.pathname, location.search, other)}
      hrefLang={other}
      lang={other}
      reloadDocument={false}
    >
      {other.toUpperCase()}
      <span className="visually-hidden"> — {t.nav.switchToLabel}</span>
    </Link>
  );

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Brand />
        <nav className="main-nav" aria-label={t.a11y.mainNav}>
          <ul>
            {links.map((l) => (
              <li key={l.to}>
                <NavLink to={l.to} end>
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="header-tools">
          <span className="hide-mobile">{langLink}</span>
          <button type="button" className="icon-btn hide-mobile" onClick={openFeedback} aria-label={t.feedback.buttonLabel} title={t.feedback.buttonLabel}>
            <MessageSquareText aria-hidden="true" />
          </button>
          <ThemeToggle />
          {user ? (
            <MenuTrigger>
              <Button className="btn btn--ghost btn--small hide-mobile" aria-label={`${t.nav.account} : ${user.username}`}>
                <User aria-hidden="true" />
                <span>{user.username.split(" ")[0]}</span>
              </Button>
              <Popover className="popover" placement="bottom end">
                <Menu className="listbox" aria-label={t.nav.account} onAction={(key) => (key === "logout" ? void signOut() : navigate(href(key === "admin" ? "admin" : "profile")))}>
                  <MenuItem id="profile" className="listbox-item">
                    {t.nav.profile}
                  </MenuItem>
                  <MenuItem id="admin" className="listbox-item">
                    {t.nav.admin}
                  </MenuItem>
                  <MenuItem id="logout" className="listbox-item">
                    {t.nav.logout}
                  </MenuItem>
                </Menu>
              </Popover>
            </MenuTrigger>
          ) : (
            // Visitors have no account: "My space" holds the trips and favourites saved on this device.
            <Link className="btn btn--small hide-mobile" to={href("profile")}>
              <User aria-hidden="true" /> {t.nav.profile}
            </Link>
          )}
          <button
            type="button"
            className="icon-btn menu-toggle"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? t.a11y.closeMenu : t.a11y.openMenu}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X aria-hidden="true" /> : <MenuIcon aria-hidden="true" />}
          </button>
        </div>
      </div>
      <div id="mobile-menu" className="container" hidden={!open}>
        <nav className="mobile-menu" aria-label={t.a11y.mainNav}>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end>
              {l.label}
            </NavLink>
          ))}
          {user ? (
            <>
              <NavLink to={href("profile")}>{t.nav.profile}</NavLink>
              <NavLink to={href("admin")}>
                <ShieldCheck aria-hidden="true" /> {t.nav.admin}
              </NavLink>
              <button type="button" className="btn btn--ghost" onClick={() => void signOut()}>
                <LogOut aria-hidden="true" /> {t.nav.logout}
              </button>
            </>
          ) : (
            <NavLink to={href("profile")}>{t.nav.profile}</NavLink>
          )}
          <button type="button" className="mobile-menu__lang" onClick={openFeedback}>
            <MessageSquareText aria-hidden="true" /> {t.feedback.button}
          </button>
          {install.available ? (
            <button type="button" className="mobile-menu__lang" onClick={install.start}>
              <Download aria-hidden="true" /> {t.pwa.install}
            </button>
          ) : null}
          <Link
            className="mobile-menu__lang"
            to={alternatePath(location.pathname, location.search, other)}
            hrefLang={other}
            lang={other}
          >
            <Globe aria-hidden="true" /> {t.nav.switchTo}
          </Link>
        </nav>
      </div>
    </header>
  );
}
