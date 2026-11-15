import { getLocalTimeZone, parseDate, today } from "@internationalized/date";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  Button,
  CalendarCell,
  CalendarGrid,
  DateInput,
  DateRangePicker,
  DateSegment,
  Dialog,
  Group,
  Heading,
  Label,
  Popover,
  RangeCalendar,
  Text,
} from "react-aria-components";
import { useT } from "../i18n";

interface DateRangeProps {
  label: string;
  start?: string | null;
  end?: string | null;
  onChange: (range: { start?: string; end?: string }) => void;
  optional?: boolean;
  description?: string;
}

const safeParse = (iso?: string | null) => {
  if (!iso) return null;
  try {
    return parseDate(iso);
  } catch {
    return null;
  }
};

export function DateRange({ label, start, end, onChange, optional, description }: DateRangeProps) {
  const t = useT();
  const s = safeParse(start);
  const e = safeParse(end);
  const value = s && e ? { start: s, end: e } : null;

  return (
    <DateRangePicker
      className="field"
      value={value}
      onChange={(range) => onChange(range ? { start: range.start.toString(), end: range.end.toString() } : {})}
      minValue={today(getLocalTimeZone())}
      granularity="day"
      shouldForceLeadingZeros
    >
      <Label className="field__label">
        {label} {optional ? <span className="field__optional">({t.common.optional})</span> : null}
      </Label>
      <Group className="date-group">
        <DateInput slot="start" className="date-field">
          {(segment) => <DateSegment segment={segment} className="date-segment" />}
        </DateInput>
        <span aria-hidden="true" className="date-sep">
          →
        </span>
        <DateInput slot="end" className="date-field">
          {(segment) => <DateSegment segment={segment} className="date-segment" />}
        </DateInput>
        {value ? (
          <Button className="icon-btn icon-btn--small" aria-label={t.dates.clear} onPress={() => onChange({})}>
            <X aria-hidden="true" />
          </Button>
        ) : null}
        <Button className="icon-btn icon-btn--small" aria-label={t.dates.calendar}>
          <CalendarDays aria-hidden="true" />
        </Button>
      </Group>
      {description ? (
        <Text slot="description" className="field__hint">
          {description}
        </Text>
      ) : null}
      <Popover className="popover" placement="bottom start">
        <Dialog className="calendar" aria-label={t.dates.calendar}>
          <RangeCalendar>
            <header>
              <Button slot="previous" className="icon-btn icon-btn--small" aria-label={t.dates.previous}>
                <ChevronLeft aria-hidden="true" />
              </Button>
              <Heading />
              <Button slot="next" className="icon-btn icon-btn--small" aria-label={t.dates.next}>
                <ChevronRight aria-hidden="true" />
              </Button>
            </header>
            <CalendarGrid>{(date) => <CalendarCell date={date} className="calendar-cell" />}</CalendarGrid>
          </RangeCalendar>
        </Dialog>
      </Popover>
    </DateRangePicker>
  );
}
