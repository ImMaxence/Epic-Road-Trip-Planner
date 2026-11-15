/** Hand-written OpenAPI 3.1 description of the public API, served at /api/docs. */
export function openApiDocument(version: string, serverUrl: string) {
  const json = (schema: object) => ({ "application/json": { schema } });
  const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
  const err = { description: "Error", content: json(ref("Error")) };
  const auth = [{ session: [] }];

  return {
    openapi: "3.1.0",
    info: {
      title: "Epic Road Trip Planner API",
      version,
      description:
        "Plan road trips across France: commune search, car / bike / walking routes, points of interest (OpenStreetMap, DataTourisme) " +
        "and a curated gallery of trips. Visitors need no account: they save trips and favourites on their device. " +
        "Writes are reserved to administrators signed in with Google (ADMIN_EMAILS); sessions use an HttpOnly cookie.",
      license: { name: "MIT", identifier: "MIT" },
    },
    servers: [{ url: serverUrl }],
    tags: [{ name: "meta" }, { name: "geo" }, { name: "trips" }, { name: "admin", description: "Google session on an ADMIN_EMAILS address" }],
    components: {
      securitySchemes: { session: { type: "apiKey", in: "cookie", name: "ert_session" } },
      schemas: {
        Error: { type: "object", properties: { error: { type: "string" }, issues: { type: "array", items: { type: "object" } } } },
        Admin: {
          type: "object",
          properties: { id: { type: "integer" }, email: { type: "string" }, username: { type: "string" }, locale: { enum: ["fr", "en"] }, isAdmin: { const: true }, createdAt: { type: "string", format: "date-time" } },
        },
        Place: {
          type: "object",
          required: ["code", "name", "lat", "lon"],
          properties: {
            code: { type: "string", description: "INSEE commune code", examples: ["13055"] },
            name: { type: "string" }, postcode: { type: "string" }, departmentCode: { type: "string" },
            lat: { type: "number" }, lon: { type: "number" },
          },
        },
        TripPlan: {
          type: "object",
          required: ["version", "from", "to"],
          properties: {
            version: { const: 1 }, from: ref("Place"), to: ref("Place"), via: { type: "array", maxItems: 12, items: ref("Place") },
            startDate: { type: ["string", "null"], format: "date" }, endDate: { type: ["string", "null"], format: "date" },
            travelMode: { enum: ["car", "bike", "foot"] }, mapStyle: { enum: ["atlas", "day", "night"] }, routeColor: { enum: ["red", "green", "blue", "yellow", "brown", "ink"] },
            radiusKm: { type: "number", minimum: 1, maximum: 30 },
            pins: { type: "array", items: { type: "object" } }, distanceKm: { type: "number" }, durationMin: { type: "number" },
          },
        },
        TripInput: {
          type: "object",
          required: ["title", "plan"],
          properties: {
            title: { type: "string", minLength: 2, maxLength: 80 },
            cover: { enum: ["city", "campfire", "forest", "mountain", "beach"] },
            isPublic: { type: "boolean" }, plan: ref("TripPlan"),
          },
        },
        Trip: { type: "object", description: "Trip summary; detail responses include `plan`." },
        Poi: {
          type: "object",
          properties: {
            id: { type: "string" }, category: { enum: ["eat", "drink", "sleep", "enjoy", "travel", "events"] },
            kind: { type: "string" }, name: { type: "string" }, lat: { type: "number" }, lon: { type: "number" },
            distanceKm: { type: "number" }, address: { type: "string" }, website: { type: "string" }, phone: { type: "string" },
            openingHours: { type: "string" }, description: { type: "string" }, image: { type: "string" },
            dateStart: { type: ["string", "null"] }, dateEnd: { type: ["string", "null"] }, source: { enum: ["osm", "datatourisme"] },
          },
        },
      },
    },
    paths: {
      "/api/health": { get: { tags: ["meta"], summary: "Liveness and dependency status", responses: { 200: { description: "OK" } } } },
      "/api/config": { get: { tags: ["meta"], summary: "Public runtime configuration (version, Google admin sign-in, feedback address)", responses: { 200: { description: "OK" } } } },
      "/api/auth/me": { get: { tags: ["admin"], summary: "Signed-in administrator (or null)", responses: { 200: { description: "OK", content: json({ type: "object", properties: { user: { oneOf: [ref("Admin"), { type: "null" }] } } }) } } } },
      "/api/auth/google/start": {
        get: { tags: ["admin"], summary: "Administrator sign-in: redirect to Google (OAuth 2.0 authorization code + PKCE)", parameters: [{ in: "query", name: "lang", schema: { enum: ["fr", "en"] } }, { in: "query", name: "next", schema: { type: "string" }, description: "Same-site path to return to" }], responses: { 303: { description: "Redirect to accounts.google.com" } } },
      },
      "/api/auth/google/callback": {
        get: { tags: ["admin"], summary: "OAuth callback: only verified addresses listed in ADMIN_EMAILS get a session", responses: { 303: { description: "Redirect to the administration, or to the sign-in page with ?error=not_admin|state_mismatch|session_expired|google_failed" } } },
      },
      "/api/auth/logout": { post: { tags: ["admin"], summary: "Close the session", responses: { 204: { description: "Signed out" } } } },
      "/api/me": {
        patch: { tags: ["admin"], security: auth, summary: "Update my display name or language", requestBody: { content: json({ type: "object", properties: { username: { type: "string" }, locale: { enum: ["fr", "en"] } } }) }, responses: { 200: { description: "OK" }, 400: err, 401: err } },
      },
      "/api/me/trips": { get: { tags: ["admin"], security: auth, summary: "My trips, public and private", responses: { 200: { description: "OK" }, 401: err } } },
      "/api/admin/stats": { get: { tags: ["admin"], security: auth, summary: "Trip counters", responses: { 200: { description: "OK" }, 401: err } } },
      "/api/admin/data": { get: { tags: ["admin"], security: auth, summary: "Freshness of the map data sources (OpenStreetMap, DataTourisme)", responses: { 200: { description: "OK" }, 401: err, 503: err } } },
      "/api/admin/data/{source}/refresh": {
        post: { tags: ["admin"], security: auth, summary: "Rebuild a data source now; the current index keeps serving until the new one is ready", parameters: [{ in: "path", name: "source", required: true, schema: { enum: ["osm", "datatourisme"] } }], responses: { 202: { description: "Started, or already running (started: false)" }, 401: err, 409: err, 503: err } },
      },
      "/api/admin/trips": { get: { tags: ["admin"], security: auth, summary: "Published trips, for curation", parameters: [{ in: "query", name: "q", schema: { type: "string" }, description: "Author" }, { in: "query", name: "limit", schema: { type: "integer", maximum: 48 } }, { in: "query", name: "offset", schema: { type: "integer" } }], responses: { 200: { description: "OK" }, 401: err } } },
      "/api/admin/trips/{id}": {
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
        patch: { tags: ["admin"], security: auth, summary: "Publish or unpublish a trip", requestBody: { required: true, content: json({ type: "object", required: ["isPublic"], properties: { isPublic: { type: "boolean" } } }) }, responses: { 204: { description: "Updated" }, 401: err, 404: err } },
        delete: { tags: ["admin"], security: auth, summary: "Delete a trip", responses: { 204: { description: "Deleted" }, 401: err, 404: err } },
      },
      "/api/trips": {
        get: {
          tags: ["trips"], summary: "Public trips gallery",
          parameters: [
            { in: "query", name: "sort", schema: { enum: ["recent", "oldest"] } },
            { in: "query", name: "from", schema: { type: "string" }, description: "Departure INSEE code or name" },
            { in: "query", name: "author", schema: { type: "string" } },
            { in: "query", name: "featured", schema: { enum: ["true", "false"] } },
            { in: "query", name: "ids", schema: { type: "string" }, description: "Comma-separated trip ids (up to 48), e.g. the favourites stored on the device", example: "1,4,9" },
            { in: "query", name: "limit", schema: { type: "integer", maximum: 48 } },
            { in: "query", name: "offset", schema: { type: "integer" } },
          ],
          responses: { 200: { description: "OK" } },
        },
        post: { tags: ["admin"], security: auth, summary: "Save a trip (administrators)", requestBody: { content: json(ref("TripInput")) }, responses: { 201: { description: "Created" }, 400: err, 401: err, 409: err } },
      },
      "/api/trips/{id}": {
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
        get: { tags: ["trips"], summary: "Trip detail (public, or private for its owner)", responses: { 200: { description: "OK" }, 404: err } },
        put: { tags: ["admin"], security: auth, summary: "Update my trip", requestBody: { content: json(ref("TripInput")) }, responses: { 200: { description: "OK" }, 403: err, 404: err } },
        delete: { tags: ["admin"], security: auth, summary: "Delete my trip", responses: { 204: { description: "Deleted" }, 403: err, 404: err } },
      },
      "/api/places/search": {
        get: { tags: ["geo"], summary: "Search French communes (accent-insensitive, ranked by population)", parameters: [{ in: "query", name: "q", required: true, schema: { type: "string" } }], responses: { 200: { description: "OK" } } },
      },
      "/api/places": {
        get: { tags: ["geo"], summary: "Resolve INSEE codes", parameters: [{ in: "query", name: "codes", required: true, schema: { type: "string" }, example: "13055,75056" }], responses: { 200: { description: "OK" } } },
      },
      "/api/pois": {
        get: {
          tags: ["geo"], summary: "Points of interest around a coordinate, grouped by category",
          parameters: [
            { in: "query", name: "lat", required: true, schema: { type: "number" } },
            { in: "query", name: "lon", required: true, schema: { type: "number" } },
            { in: "query", name: "radius", schema: { type: "number", default: 5, maximum: 30 } },
            { in: "query", name: "from", schema: { type: "string", format: "date" } },
            { in: "query", name: "to", schema: { type: "string", format: "date" } },
            { in: "query", name: "lang", schema: { enum: ["fr", "en"] } },
          ],
          responses: { 200: { description: "OK" }, 503: err },
        },
      },
      "/api/route": {
        get: {
          tags: ["geo"], summary: "Car, bike or walking route through 2–14 points (OSRM), with straight-line fallback",
          parameters: [
            { in: "query", name: "points", required: true, schema: { type: "string" }, example: "43.2803,5.3806;48.8589,2.347" },
            { in: "query", name: "mode", schema: { enum: ["car", "bike", "foot"], default: "car" } },
          ],
          responses: { 200: { description: "OK" }, 400: err },
        },
      },
    },
  };
}
