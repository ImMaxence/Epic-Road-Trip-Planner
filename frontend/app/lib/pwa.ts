import { useEffect, useSyncExternalStore } from "react";

/** Chromium's install prompt event (not yet in lib.dom). */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault(); // we show our own button instead of the mini-infobar
    deferred = event as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    emit();
  });
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** `install` is set only when the browser offers installation (Chromium, Edge, Android). */
export function useInstallPrompt(): { install: (() => Promise<boolean>) | null } {
  const available = useSyncExternalStore(subscribe, () => deferred !== null, () => false);
  if (!available) return { install: null };
  return {
    install: async () => {
      const event = deferred;
      if (!event) return false;
      deferred = null;
      emit();
      await event.prompt();
      return (await event.userChoice).outcome === "accepted";
    },
  };
}

const onlineSubscribe = (listener: () => void) => {
  window.addEventListener("online", listener);
  window.addEventListener("offline", listener);
  return () => {
    window.removeEventListener("online", listener);
    window.removeEventListener("offline", listener);
  };
};

export const useOnline = () => useSyncExternalStore(onlineSubscribe, () => navigator.onLine, () => true);

/** Registers the service worker in production builds (offline pages, cached assets and tiles). */
export function useServiceWorker() {
  useEffect(() => {
    if (import.meta.env.DEV || !("serviceWorker" in navigator)) return;
    const register = () => navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
    if (document.readyState === "complete") void register();
    else window.addEventListener("load", () => void register(), { once: true });
  }, []);
}
