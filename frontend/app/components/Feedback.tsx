import { Bug, Copy, Mail, X } from "lucide-react";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { Button, Dialog, Heading, Modal, ModalOverlay } from "react-aria-components";
import { useLocation } from "react-router";
import { useT } from "../i18n";
import { decodeMailbox } from "../lib/api";
import { usePublicConfig } from "../lib/auth";
import { APP_VERSION, REPO_URL } from "../lib/site";
import { useToast } from "./Toast";

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
  const config = usePublicConfig();
  const toast = useToast();
  if (!isOpen) return null;

  const page = `${window.location.origin}${location.pathname}${location.search}`;
  const body = t.feedback.template(page, APP_VERSION, browserName());
  const issueUrl = `${REPO_URL}/issues/new?${new URLSearchParams({ title: t.feedback.issueTitle, body })}`;
  const mailbox = config.data?.feedbackMailbox ?? null;
  const writeEmail = () => {
    window.location.href = `mailto:${decodeMailbox(mailbox!)}?subject=${encodeURIComponent(t.feedback.mailSubject)}&body=${encodeURIComponent(body)}`;
    onOpenChange(false);
  };
  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(decodeMailbox(mailbox!));
      toast(t.feedback.emailCopied);
    } catch {
      toast(t.auth.errors.generic, "error");
    }
  };

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
                {mailbox ? (
                  <section className="feedback__option" aria-labelledby="fb-mail">
                    <h3 id="fb-mail">
                      <Mail aria-hidden="true" /> {t.feedback.emailTitle}
                    </h3>
                    <p>{t.feedback.emailText}</p>
                    <div className="button-row">
                      <button type="button" className="btn" onClick={writeEmail}>
                        <Mail aria-hidden="true" /> {t.feedback.emailButton}
                      </button>
                      <button type="button" className="btn btn--ghost" onClick={() => void copyEmail()}>
                        <Copy aria-hidden="true" /> {t.feedback.copyEmail}
                      </button>
                    </div>
                  </section>
                ) : null}
              </div>
              <p className="field__hint">{t.feedback.context}</p>
            </>
          )}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
