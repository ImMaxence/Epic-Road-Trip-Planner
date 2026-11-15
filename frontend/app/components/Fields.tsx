import type { ReactNode } from "react";
import { FieldError, Input, Label, Text, TextField } from "react-aria-components";
import { useT } from "../i18n";

interface FieldProps {
  id?: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: "text" | "email";
  autoComplete?: string;
  description?: ReactNode;
  error?: string;
  isRequired?: boolean;
  isReadOnly?: boolean;
  maxLength?: number;
  inputMode?: "text" | "email";
  className?: string;
}

function RequiredLabel({ label, isRequired }: { label: string; isRequired?: boolean }) {
  const t = useT();
  return (
    <Label className="field__label">
      {label}
      {isRequired ? <span aria-hidden="true"> *</span> : null}
      {isRequired ? <span className="visually-hidden"> ({t.common.required})</span> : null}
    </Label>
  );
}

export function Field({ id, label, value, onChange, type = "text", autoComplete, description, error, isRequired, isReadOnly, maxLength, inputMode, className }: FieldProps) {
  return (
    <TextField
      id={id}
      className={`field ${className ?? ""}`}
      value={value}
      onChange={onChange}
      type={type}
      autoComplete={autoComplete}
      isRequired={isRequired}
      isReadOnly={isReadOnly}
      isInvalid={Boolean(error)}
      maxLength={maxLength}
      inputMode={inputMode}
      validationBehavior="aria"
    >
      <RequiredLabel label={label} isRequired={isRequired} />
      <Input spellCheck={type === "email" ? false : undefined} autoCapitalize={type === "email" ? "none" : undefined} />
      {description ? (
        <Text slot="description" className="field__hint">
          {description}
        </Text>
      ) : null}
      <FieldError className="field__error">{error}</FieldError>
    </TextField>
  );
}

export interface FormError {
  field: string;
  message: string;
}

/** Error summary focused on submit (RGAA 11.10 / WCAG 3.3.1). */
export function ErrorSummary({ errors, id = "form-errors" }: { errors: FormError[]; id?: string }) {
  const t = useT();
  if (!errors.length) return null;
  return (
    <div className="error-summary" id={id} tabIndex={-1} role="alert">
      <h2>{t.auth.errorSummary(errors.length)}</h2>
      <ul>
        {errors.map((e) => (
          <li key={e.field + e.message}>{e.field ? <a href={`#${e.field}`}>{e.message}</a> : e.message}</li>
        ))}
      </ul>
    </div>
  );
}

/** Focus the error summary after a failed submit (it is rendered on the next frame). */
export const focusErrors = (id = "form-errors") => requestAnimationFrame(() => document.getElementById(id)?.focus());
