import { useInfiniteQuery } from "@tanstack/react-query";
import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Button, Checkbox, Label, ListBox, ListBoxItem, Popover, Select, SelectValue } from "react-aria-components";
import type { MetaFunction } from "react-router";
import { Field } from "../components/Fields";
import { TripCard } from "../components/TripCard";
import { DICTS, langFromPath, useT } from "../i18n";
import { api } from "../lib/api";
import { useLocalFavorites } from "../lib/local-store";
import { useDebounced } from "../lib/hooks";
import { breadcrumbLd, seo } from "../lib/seo";

export const meta: MetaFunction = ({ location }) => {
  const lang = langFromPath(location.pathname);
  const t = DICTS[lang];
  return seo({
    pathname: location.pathname,
    title: t.trips.metaTitle,
    description: t.trips.metaDescription,
    jsonLd: [breadcrumbLd(lang, "trips", t.pages.trips), { "@type": "CollectionPage", name: t.trips.title, description: t.trips.metaDescription }],
  });
};

const PAGE = 12;
type Sort = "recent" | "oldest";

export default function Trips() {
  const t = useT();
  const favoriteIds = useLocalFavorites();
  const [from, setFrom] = useState("");
  const [author, setAuthor] = useState("");
  const [sort, setSort] = useState<Sort>("recent");
  const [favorites, setFavorites] = useState(false);
  const filters = { from: useDebounced(from.trim(), 300), author: useDebounced(author.trim(), 300), sort, ids: favorites ? favoriteIds.slice(-48) : undefined };

  const query = useInfiniteQuery({
    queryKey: ["trips", "gallery", filters],
    // Favourites live on this device: an empty list simply means no result.
    queryFn: ({ pageParam }) => (filters.ids && !filters.ids.length ? Promise.resolve({ items: [], total: 0 }) : api.trips({ ...filters, limit: PAGE, offset: pageParam })),
    initialPageParam: 0,
    getNextPageParam: (last, pages) => {
      const loaded = pages.reduce((n, p) => n + p.items.length, 0);
      return loaded < last.total ? loaded : undefined;
    },
  });
  const items = query.data?.pages.flatMap((p) => p.items) ?? [];
  const total = query.data?.pages[0]?.total ?? 0;

  return (
    <>
      <div className="container page-head">
        <h1>{t.trips.title}</h1>
        <p>{t.trips.lead}</p>
      </div>
      <div className="container">
        <form className="filters" role="search" aria-label={t.trips.filters} onSubmit={(e) => e.preventDefault()}>
          <Field label={t.trips.fromFilter} value={from} onChange={setFrom} />
          <Field label={t.trips.authorFilter} value={author} onChange={setAuthor} />
          <Select className="field" selectedKey={sort} onSelectionChange={(k) => setSort(k as Sort)}>
            <Label className="field__label">{t.trips.sort}</Label>
            <Button className="select-trigger">
              <SelectValue />
              <ChevronDown aria-hidden="true" width={18} height={18} />
            </Button>
            <Popover className="popover">
              <ListBox className="listbox">
                {(["recent", "oldest"] as Sort[]).map((s) => (
                  <ListBoxItem key={s} id={s} className="listbox-item">
                    {t.trips.sorts[s]}
                  </ListBoxItem>
                ))}
              </ListBox>
            </Popover>
          </Select>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => {
              setFrom("");
              setAuthor("");
              setSort("recent");
              setFavorites(false);
            }}
          >
            {t.trips.reset}
          </button>
          <div className="filters__foot">
            <Checkbox className="check" isSelected={favorites} onChange={setFavorites}>
              <span className="check__box" aria-hidden="true">
                <Check />
              </span>
              {t.trips.onlyFavorites}
            </Checkbox>
          </div>
        </form>

        <p className="results-count" role="status" aria-live="polite">
          {query.isPending ? t.a11y.loading : query.isError ? "" : t.common.resultsCount(total)}
        </p>
        {query.isError ? (
          <p className="notice notice--error">
            {t.trips.error}{" "}
            <button type="button" className="btn btn--small" onClick={() => void query.refetch()}>
              {t.common.retry}
            </button>
          </p>
        ) : null}
        {!query.isPending && !items.length && !query.isError ? <p className="empty-state">{t.trips.empty}</p> : null}
        {items.length ? (
          <ul className="ticket-grid">
            {items.map((trip) => (
              <li key={trip.id}>
                <TripCard trip={trip} headingLevel={2} />
              </li>
            ))}
          </ul>
        ) : null}
        {query.hasNextPage ? (
          <div className="load-more">
            <button type="button" className="btn btn--ghost btn--lg" onClick={() => void query.fetchNextPage()} disabled={query.isFetchingNextPage}>
              {t.common.loadMore}
            </button>
          </div>
        ) : null}
      </div>
    </>
  );
}
