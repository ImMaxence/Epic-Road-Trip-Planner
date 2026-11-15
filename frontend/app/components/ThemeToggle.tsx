import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, Menu, MenuItem, MenuTrigger, Popover } from "react-aria-components";
import { useT } from "../i18n";

type Theme = "light" | "dark" | "system";
const STORAGE_KEY = "ert-theme";

function readTheme(): Theme {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") delete root.dataset.theme;
  else root.dataset.theme = theme;
  try {
    if (theme === "system") localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* storage unavailable (private mode): the choice lasts for this page only */
  }
  window.dispatchEvent(new CustomEvent("ert-theme", { detail: theme }));
}

/** Inline script run before paint so the stored theme never flashes. */
export const THEME_BOOTSTRAP = `try{var t=localStorage.getItem("${STORAGE_KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export function ThemeToggle() {
  const t = useT();
  const [theme, setTheme] = useState<Theme>("system");
  useEffect(() => setTheme(readTheme()), []);

  const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;
  const labels: Record<Theme, string> = { light: t.nav.themeLight, dark: t.nav.themeDark, system: t.nav.themeSystem };

  return (
    <MenuTrigger>
      <Button className="icon-btn" aria-label={`${t.nav.theme} : ${labels[theme]}`}>
        <Icon aria-hidden="true" />
      </Button>
      <Popover className="popover" placement="bottom end">
        <Menu
          className="listbox"
          aria-label={t.nav.theme}
          selectionMode="single"
          selectedKeys={[theme]}
          onAction={(key) => {
            const next = key as Theme;
            setTheme(next);
            applyTheme(next);
          }}
        >
          {(["light", "dark", "system"] as Theme[]).map((value) => {
            const ItemIcon = value === "dark" ? Moon : value === "light" ? Sun : Monitor;
            return (
              <MenuItem key={value} id={value} className="listbox-item" textValue={labels[value]}>
                <span style={{ display: "inline-flex", gap: "0.6rem", alignItems: "center" }}>
                  <ItemIcon width={18} height={18} aria-hidden="true" />
                  {labels[value]}
                </span>
              </MenuItem>
            );
          })}
        </Menu>
      </Popover>
    </MenuTrigger>
  );
}
