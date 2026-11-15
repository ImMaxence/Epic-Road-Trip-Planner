import { Copy, Share2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, Dialog, Heading, Modal, ModalOverlay } from "react-aria-components";
import { useT } from "../../i18n";
import { useToast } from "../Toast";

interface Props {
  url: string | null;
  title: string;
  pinCount: number;
  onClose: () => void;
}

/**
 * Share a trip without any account: a link carrying the whole itinerary (and pinned places),
 * shown as a QR code to open it on a phone, copied, or handed to the system share sheet.
 */
export function ShareDialog({ url, title, pinCount, onClose }: Props) {
  const t = useT();
  const toast = useToast();
  const [svg, setSvg] = useState<string>();
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  useEffect(() => {
    if (!url) return;
    let alive = true;
    // The QR generator is only downloaded when someone shares.
    void import("uqr").then(({ renderSVG }) => {
      if (alive) setSvg(renderSVG(url, { ecc: "L", border: 2, pixelSize: 6, blackColor: "#1d2433", whiteColor: "#ffffff" }));
    });
    return () => {
      alive = false;
      setSvg(undefined);
    };
  }, [url]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url ?? "");
      toast(t.planner.linkCopied);
    } catch {
      toast(t.planner.copyFailed, "error");
    }
  };

  const share = async () => {
    try {
      await navigator.share({ title, url: url ?? undefined });
    } catch (e) {
      if ((e as Error).name !== "AbortError") toast(t.planner.copyFailed, "error");
    }
  };

  return (
    <ModalOverlay className="modal-overlay" isOpen={Boolean(url)} onOpenChange={(open) => !open && onClose()} isDismissable>
      <Modal className="modal">
        <Dialog className="dialog share">
          {({ close }) => (
            <>
              <div className="dialog__head">
                <Heading slot="title">{t.share.title}</Heading>
                <Button className="icon-btn" onPress={close} aria-label={t.a11y.close}>
                  <X aria-hidden="true" />
                </Button>
              </div>
              <p>{t.share.lead(pinCount)}</p>
              <div className="share__qr" role="img" aria-label={t.share.qrLabel}>
                {svg ? <span dangerouslySetInnerHTML={{ __html: svg }} /> : <span className="spinner" aria-hidden="true" />}
              </div>
              <p className="field__hint share__hint">{t.share.qrHint}</p>
              <label className="field">
                <span className="field__label">{t.share.link}</span>
                <input className="share__url" type="url" value={url ?? ""} readOnly onFocus={(e) => e.currentTarget.select()} />
              </label>
              <div className="dialog__actions">
                {canShare ? (
                  <Button className="btn btn--ghost" onPress={() => void share()}>
                    <Share2 aria-hidden="true" /> {t.share.native}
                  </Button>
                ) : null}
                <Button className="btn btn--red" onPress={() => void copy()}>
                  <Copy aria-hidden="true" /> {t.share.copy}
                </Button>
              </div>
            </>
          )}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
