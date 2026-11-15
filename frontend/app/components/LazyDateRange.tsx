import { lazy, Suspense, type ComponentProps } from "react";
import type { DateRange as DateRangeType } from "./DateRange";

// The calendar (React Aria + @internationalized/date) is the heaviest form widget:
// it is split out of the initial bundle. Pre-rendered HTML still contains it (React waits for it at build time).
const DateRange = lazy(() => import("./DateRange").then((m) => ({ default: m.DateRange })));

export function LazyDateRange(props: ComponentProps<typeof DateRangeType>) {
  return (
    <Suspense fallback={<div className="field" style={{ minHeight: 76 }} aria-hidden="true" />}>
      <DateRange {...props} />
    </Suspense>
  );
}
