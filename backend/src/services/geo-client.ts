import { HttpError } from "../lib/http-error.ts";
import { TtlCache } from "../lib/ttl-cache.ts";

/** Thin client for the internal Python geo service (communes + points of interest). */
export class GeoClient {
  readonly #baseUrl: string;
  readonly #fetch: typeof fetch;
  readonly #cache = new TtlCache<unknown>(2000, 10 * 60 * 1000);

  constructor(baseUrl: string, fetchImpl: typeof fetch = fetch) {
    this.#baseUrl = baseUrl.replace(/\/$/, "");
    this.#fetch = fetchImpl;
  }

  async get<T>(path: string, params: Record<string, string | number | undefined>, cache = true): Promise<T> {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) if (value !== undefined && value !== "") search.set(key, String(value));
    const url = `${this.#baseUrl}${path}?${search}`;
    if (cache) {
      const hit = this.#cache.get(url);
      if (hit) return hit as T;
    }
    let response: Response;
    try {
      response = await this.#fetch(url, { signal: AbortSignal.timeout(20_000) });
    } catch {
      throw new HttpError(503, "geo_unavailable");
    }
    if (response.status === 422) throw new HttpError(400, "invalid_query");
    if (!response.ok) throw new HttpError(502, "geo_error");
    const body = (await response.json()) as T;
    if (cache) this.#cache.set(url, body);
    return body;
  }

  async health(): Promise<unknown> {
    return this.get("/health", {}, false);
  }

  /** Asks the geo service to rebuild a data source now (administration). */
  async refresh(source: "osm" | "datatourisme", token?: string): Promise<{ started: boolean; job: string | null }> {
    let response: Response;
    try {
      response = await this.#fetch(`${this.#baseUrl}/refresh/${source}`, {
        method: "POST",
        headers: token ? { "X-Admin-Token": token } : {},
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      throw new HttpError(503, "geo_unavailable");
    }
    if (response.status === 409) throw new HttpError(409, "source_not_configured");
    if (!response.ok) throw new HttpError(502, "geo_error");
    return (await response.json()) as { started: boolean; job: string | null };
  }
}
