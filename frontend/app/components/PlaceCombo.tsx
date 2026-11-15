import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ComboBox, FieldError, Input, Label, ListBox, ListBoxItem, Popover, Text } from "react-aria-components";
import { useT } from "../i18n";
import { api, type Place } from "../lib/api";
import { useDebounced } from "../lib/hooks";

const isPendingQuery = (input: string, debounced: string) => input.trim() !== debounced;

interface PlaceComboProps {
  label: string;
  value?: Place;
  onChange: (place: Place | undefined) => void;
  isRequired?: boolean;
  errorMessage?: string;
  hideLabel?: boolean;
  autoFocus?: boolean;
  className?: string;
  description?: string;
}

/**
 * Accessible commune autocomplete (React Aria ComboBox + /api/places/search).
 * The typed text never silently replaces a chosen commune: leaving the field restores it.
 */
export function PlaceCombo({ label, value, onChange, isRequired, errorMessage, hideLabel, autoFocus, className, description }: PlaceComboProps) {
  const t = useT();
  const [input, setInput] = useState(value?.name ?? "");
  const query = useDebounced(input.trim(), 180);

  useEffect(() => {
    setInput(value?.name ?? "");
  }, [value?.code, value?.name]);

  const searching = query.length >= 2 && query !== value?.name;
  // Decided on the raw input (not the debounced query) so the list opens on the very first keystroke
  // and shows "Searching…" until results arrive; otherwise fast typing or pasting never opens it.
  const typing = input.trim().length >= 2 && input.trim() !== value?.name;
  const pending = isPendingQuery(input, query);
  const { data, isFetching } = useQuery({
    queryKey: ["places", query],
    queryFn: ({ signal }) => api.searchPlaces(query, signal).then((r) => r.results),
    enabled: searching,
    staleTime: 5 * 60_000,
    placeholderData: (previous) => previous,
  });
  const items = searching && typing ? (data ?? []) : [];

  return (
    <ComboBox
      className={`field ${className ?? ""}`}
      inputValue={input}
      onInputChange={setInput}
      selectedKey={value?.code ?? null}
      onSelectionChange={(key) => {
        const picked = items.find((p) => p.code === key);
        if (picked) {
          onChange(picked);
          setInput(picked.name);
        }
      }}
      items={items}
      menuTrigger="input"
      allowsCustomValue
      allowsEmptyCollection={typing}
      isRequired={isRequired}
      isInvalid={Boolean(errorMessage)}
      autoFocus={autoFocus}
    >
      <Label className={hideLabel ? "visually-hidden" : "field__label"}>{label}</Label>
      <Input
        placeholder={t.place.placeholder}
        autoComplete="off"
        spellCheck={false}
        onBlur={() => {
          if (!input.trim()) {
            if (value) onChange(undefined);
          } else if (value && input !== value.name) {
            setInput(value.name);
          }
        }}
      />
      <Text slot="description" className={description ? "field__hint" : "visually-hidden"}>
        {description ?? t.place.hint}
      </Text>
      {errorMessage ? <FieldError className="field__error">{errorMessage}</FieldError> : null}
      <Popover className="popover" placement="bottom start" offset={4}>
        <ListBox<Place>
          className="listbox"
          renderEmptyState={() => <div className="listbox-empty">{isFetching || pending ? t.place.searching : t.place.noResult}</div>}
        >
          {(place) => (
            <ListBoxItem id={place.code} className="listbox-item" textValue={place.name}>
              <span>
                <strong>{place.name}</strong> ({place.departmentCode})
              </span>
              <span className="combo-option__meta">
                {place.department}
                {place.population ? ` · ${t.place.population(place.population)}` : ""}
              </span>
            </ListBoxItem>
          )}
        </ListBox>
      </Popover>
    </ComboBox>
  );
}
