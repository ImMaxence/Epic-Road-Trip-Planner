import { Check, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Button, Checkbox, Dialog, Heading, Input, Label, Modal, ModalOverlay, Radio, RadioGroup, Text, TextField, FieldError } from "react-aria-components";
import { useT } from "../../i18n";
import { ApiError, type Cover } from "../../lib/api";
import { COVERS, CoverArt } from "../CoverArt";

export interface SaveValues {
  title: string;
  cover: Cover;
  isPublic: boolean;
}

interface SaveDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initial: SaveValues;
  isUpdate: boolean;
  canPublish: boolean;
  /** Shown instead of the "publish" option (trips saved on this device). */
  note?: string;
  onSubmit: (values: SaveValues) => Promise<void>;
}

export function SaveDialog({ isOpen, onOpenChange, initial, isUpdate, canPublish, note, onSubmit }: SaveDialogProps) {
  const t = useT();
  const [values, setValues] = useState(initial);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setValues(initial);
      setError(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (values.title.trim().length < 2) {
      setError(t.auth.fieldRequired(t.planner.saveName));
      return;
    }
    setBusy(true);
    try {
      await onSubmit({ ...values, title: values.title.trim() });
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof ApiError ? (t.auth.errors[e.code] ?? t.planner.saveError) : e instanceof Error && e.message ? e.message : t.planner.saveError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalOverlay className="modal-overlay" isOpen={isOpen} onOpenChange={onOpenChange} isDismissable>
      <Modal className="modal">
        <Dialog className="dialog">
          {({ close }) => (
            <form onSubmit={submit} noValidate>
              <div className="dialog__head">
                <Heading slot="title">{t.planner.saveTitle}</Heading>
                <Button className="icon-btn" onPress={close} aria-label={t.a11y.close}>
                  <X aria-hidden="true" />
                </Button>
              </div>
              {error ? (
                <p className="notice notice--error" role="alert">
                  {error}
                </p>
              ) : null}
              <TextField className="field" value={values.title} onChange={(title) => setValues((v) => ({ ...v, title }))} isRequired maxLength={80} autoFocus isInvalid={Boolean(error) && values.title.trim().length < 2}>
                <Label className="field__label">{t.planner.saveName}</Label>
                <Input />
                <FieldError className="field__error" />
              </TextField>

              <RadioGroup className="field cover-picker" value={values.cover} onChange={(cover) => setValues((v) => ({ ...v, cover: cover as Cover }))} style={{ marginTop: "1.25rem" }}>
                <Label className="field__label">{t.planner.saveCover}</Label>
                <div className="cover-picker__grid">
                  {COVERS.map((cover) => (
                    <Radio key={cover} value={cover} className="cover-option">
                      <CoverArt cover={cover} />
                      <span>{t.planner.covers[cover]}</span>
                    </Radio>
                  ))}
                </div>
              </RadioGroup>

              {canPublish ? (
              <Checkbox className="check" isSelected={values.isPublic} onChange={(isPublic) => setValues((v) => ({ ...v, isPublic }))} style={{ marginTop: "1rem" }}>
                <span className="check__box" aria-hidden="true">
                  <Check />
                </span>
                <span>
                  <strong>{t.planner.savePublic}</strong>
                  <Text slot="description" className="field__hint" elementType="span" style={{ display: "block" }}>
                    {t.planner.savePublicHint}
                  </Text>
                </span>
              </Checkbox>
              ) : (
                <p className="notice notice--info" style={{ marginTop: "1rem" }}>{note}</p>
              )}

              <div className="dialog__actions">
                <Button className="btn btn--ghost" onPress={close}>
                  {t.common.cancel}
                </Button>
                <Button type="submit" className="btn btn--red" isDisabled={busy}>
                  {isUpdate ? t.planner.update : t.planner.save}
                </Button>
              </div>
            </form>
          )}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
