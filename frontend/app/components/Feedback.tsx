import { Bug, Mail, X } from "lucide-react";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { Button, Dialog, Heading, Modal, ModalOverlay } from "react-aria-components";
import { useLocation } from "react-router";
import { useT } from "../i18n";
import { APP_VERSION, OWNER, REPO_URL } from "../lib/site";

const FeedbackContext = createContext<() => void>(() => {});

/** Opens the "Feedback / bug" dialog from anywhere (header, mobile menu, footer, forms). */
export const useFeedback = () => useContext(FeedbackContext);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const show = useCallback(() => setOpen(true), []);
  return (
    <FeedbackContext.Provider value={show}>
      {children}
      <FeedbackDialog isOpen={open} onOpenChange={setOpen} />
    </FeedbackContext.Provider>
  );
}

/** Short, non-identifying browser description for bug reports. */
function browserName(): string {
  if (typeof navigator === "undefined") return "";
  const ua = navigator.userAgent;
  // Checked in this order: Edge and Chrome UAs also contain "Chrome" and "Safari".
  const engines: [string, RegExp][] = [["Edge", /Edg\/(\d+)/], ["Firefox", /Firefox\/(\d+)/], ["Chrome", /Chrome\/(\d+)/], ["Safari", /Version\/(\d+).*Safari/]];
  const browser = engines.map(([name, re]) => (re.exec(ua) ? `${name} ${re.exec(ua)![1]}` : null)).find(Boolean) ?? "?";
  const os = /Android|iPhone|iPad|Windows|Mac OS X|Linux/.exec(ua)?.[0] ?? "?";
  return `${browser} · ${os} · ${window.innerWidth}×${window.innerHeight}`;
}

function FeedbackDialog({ isOpen, onOpenChange }: { isOpen: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useT();
  const location = useLocation();
  if (!isOpen) return null;

  const page = `${window.location.origin}${location.pathname}${location.search}`;
  const body = t.feedback.template(page, APP_VERSION, browserName());
  const issueUrl = `${REPO_URL}/issues/new?${new URLSearchParams({ title: t.feedback.issueTitle, body })}`;

  return (
    <ModalOverlay className="modal-overlay" isOpen={isOpen} onOpenChange={onOpenChange} isDismissable>
      <Modal className="modal">
        <Dialog className="dialog feedback">
          {({ close }) => (
            <>
              <div className="dialog__head">
                <Heading slot="title">{t.feedback.title}</Heading>
                <Button className="icon-btn" onPress={close} aria-label={t.a11y.close}>
                  <X aria-hidden="true" />
                </Button>
              </div>
              <p>{t.feedback.lead}</p>
              <div className="feedback__options">
                <section className="feedback__option" aria-labelledby="fb-github">
                  <h3 id="fb-github">
                    <Bug aria-hidden="true" /> {t.feedback.githubTitle}
                  </h3>
                  <p>{t.feedback.githubText}</p>
                  <a className="btn btn--red" href={issueUrl} target="_blank" rel="noopener noreferrer" onClick={close}>
                    {t.feedback.githubButton} <span className="visually-hidden">{t.a11y.externalLink}</span>
                  </a>
                </section>
                <section className="feedback__option" aria-labelledby="fb-contact">
                  <h3 id="fb-contact">
                    <Mail aria-hidden="true" /> {t.feedback.contactTitle}
                  </h3>
                  <p>{t.feedback.contactText}</p>
                  <a className="btn" href={OWNER.contact} target="_blank" rel="noopener noreferrer" onClick={close}>
                    {t.feedback.contactButton} <span className="visually-hidden">{t.a11y.externalLink}</span>
                  </a>
                </section>
              </div>
              <p className="field__hint">{t.feedback.context}</p>
            </>
          )}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
