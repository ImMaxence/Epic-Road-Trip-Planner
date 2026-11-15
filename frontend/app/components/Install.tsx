import { Share, SquarePlus, X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Button, Dialog, Heading, Modal, ModalOverlay } from "react-aria-components";
import { useT } from "../i18n";
import { useInstallPrompt } from "../lib/pwa";

interface InstallState {
  /** Installation is possible here: native prompt (Chromium) or manual steps (iOS). */
  available: boolean;
  start: () => void;
}

const InstallContext = createContext<InstallState>({ available: false, start: () => {} });
export const useInstall = () => useContext(InstallContext);

/** iPhone / iPad (iPadOS reports itself as a Mac with a touch screen), not already launched from the home screen. */
function canInstallOnIos(): boolean {
  const ua = navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
  const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return ios && !standalone;
}

export function InstallProvider({ children }: { children: ReactNode }) {
  const { install } = useInstallPrompt();
  const [ios, setIos] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  useEffect(() => setIos(canInstallOnIos()), []);

  const start = useCallback(() => {
    if (install) void install();
    else if (ios) setHelpOpen(true);
  }, [install, ios]);

  return (
    <InstallContext.Provider value={{ available: Boolean(install) || ios, start }}>
      {children}
      {helpOpen ? <IosInstallHelp onClose={() => setHelpOpen(false)} /> : null}
    </InstallContext.Provider>
  );
}

function IosInstallHelp({ onClose }: { onClose: () => void }) {
  const t = useT();
  return (
    <ModalOverlay className="modal-overlay" isOpen onOpenChange={(open) => !open && onClose()} isDismissable>
      <Modal className="modal">
        <Dialog className="dialog">
          {({ close }) => (
            <>
              <div className="dialog__head">
                <Heading slot="title">{t.pwa.iosTitle}</Heading>
                <Button className="icon-btn" onPress={close} aria-label={t.a11y.close}>
                  <X aria-hidden="true" />
                </Button>
              </div>
              <p>{t.pwa.iosLead}</p>
              <ol className="install-steps">
                <li>{t.pwa.iosStep1}</li>
                <li>
                  <span className="install-steps__icon" aria-hidden="true">
                    <Share />
                  </span>
                  {t.pwa.iosStep2}
                </li>
                <li>
                  <span className="install-steps__icon" aria-hidden="true">
                    <SquarePlus />
                  </span>
                  {t.pwa.iosStep3}
                </li>
                <li>{t.pwa.iosStep4}</li>
              </ol>
              <p className="field__hint">{t.pwa.iosNote}</p>
              <div className="dialog__actions">
                <Button className="btn btn--red" onPress={close}>
                  {t.a11y.close}
                </Button>
              </div>
            </>
          )}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
