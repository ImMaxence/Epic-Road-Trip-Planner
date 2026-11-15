# Changelog

All notable changes to Epic Road Trip Planner are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html): **MAJOR.MINOR.PATCH**.

| Part | When it changes | Example |
|------|-----------------|---------|
| **MAJOR** | Breaking change: data model, public API, deployment or URLs change in a non-compatible way | `1.0.0` → `2.0.0` |
| **MINOR** (medium) | New feature or visible improvement, backward compatible | `2.0.0` → `2.1.0` |
| **PATCH** (minor) | Bug fix, content or dependency update, no new feature | `2.1.0` → `2.1.1` |

The current version is shown in the site footer and returned by `GET /api/health`.

## [Unreleased]

## [2.0.0] — 2026-11-15

Complete redesign and rebuild of the 2024 Epitech project. Nothing from the 1.x code base is reused; saved data from 1.x is not migrated.

### Added
- New visual identity inspired by French road atlases and road signage: paper and asphalt themes, kilometre milestones (*bornes*) for stops, direction-sign hero, travel-poster illustrations drawn for the project, self-hosted typefaces.
- French and English versions with localised URLs (`/fr/planifier`, `/en/plan`…), language negotiation on `/` and a language switcher that keeps the current page.
- Planner: real route by car, bike or on foot through up to 12 stops (one OSRM engine per travel mode) with distance and travel time per leg, straight-line fallback, stop reordering by buttons, travel dates, readable URLs based on official INSEE commune codes.
- Places around any stop within 2–20 km in six categories (eat, drinks, sleep, explore, get around, events) from a monthly OpenStreetMap extract of France, with optional DataTourisme events.
- Interactive MapLibre map with three basemaps (*Atlas*, *Day*, *Night*), six route colours, clustering and an accessible list alternative.
- Pinned places ("road book") highlighted on the map, print / PDF road book with map, distances and pins. The map legend shows the date of the last data refresh.
- No visitor accounts: trips and favourites are kept in the browser ("My space"), with JSON export and import to move them between devices, and a one-click wipe.
- Sharing by link or QR code: the link carries stops, dates, travel mode and pinned places; nothing is stored on the server.
- Installable Progressive Web App: localised manifests with shortcuts and screenshots, service worker with offline pages, cached assets and map tiles, offline notice and install button.
- "Feedback / bug" dialog on every page: pre-filled GitHub issue (page, version, browser) or the author's contact form.
- Administration "Map data" panel: last rebuild date and size of each source, live progress, and an "Update now" button that rebuilds the OpenStreetMap or DataTourisme index on demand (the current index keeps serving until the swap).
- Install help for iPhone and iPad, where browsers offer no install prompt.
- Curated public gallery with filters, sorting and on-device favourites. Administrators sign in with Google (OAuth 2.0 authorization code + PKCE, server-side, no Google script in pages), restricted to `ADMIN_EMAILS`, to publish, unpublish or delete trips; removing an address revokes its session at once.
- Six curated itineraries ("team picks"): Great Alpine Road, Loire Valley, Provence & Riviera, Brittany, Alsace Wine Route, Basque Country.
- Legal pages: legal notice, privacy policy, terms of use, accessibility statement (RGAA 4.1.2), sitemap page.
- SEO: pre-rendered pages, canonical and `hreflang` alternates, Open Graph cards, JSON-LD (WebApplication, FAQPage, BreadcrumbList), `sitemap.xml`, `robots.txt`.
- AI SEO: `llms.txt` and `llms-full.txt`, explicit welcome for AI crawlers, documented deep-link format for assistants.
- Accessibility: React Aria components, skip link, focus management on navigation, high-visibility focus ring, live status messages, reduced motion, reflow at 320 px, automated axe-core checks in light and dark themes.
- Public REST API documented with OpenAPI 3.1 (`/api/docs`).
- Docker Compose stack ready for Coolify (healthchecks, generated secrets, no published ports), local override for Docker Desktop.
- Tests: backend unit and MariaDB integration tests (Vitest), geo-service tests (pytest), end-to-end and accessibility tests (Playwright + axe-core), GitHub Actions CI.

### Changed
- License: MIT (previously Unlicense).
- Front end rewritten with React 19, React Router 8 (pre-rendering), TypeScript and Vite 8, replacing Create React App and Ant Design.
- Back end rewritten in TypeScript on Node.js 26 and Express 5 with Drizzle ORM, zod validation and SQL migrations, replacing the untyped Express 4 / Sequelize API.
- Python service rewritten with FastAPI and SQLite: commune search and spatial queries in milliseconds instead of loading 88 MB of JSON with pandas on every request.
- Commune search uses the official INSEE dataset with population ranking and accent-insensitive matching.
- Map tiles, styles and fonts are proxied and cached by nginx: browsers no longer contact third-party map services.

### Removed
- Hard-coded Thunderforest API key, Google client ID and JWT secret.
- phpMyAdmin and Portainer containers, and all published database/service ports.
- The 2024 DataTourisme snapshot (88 MB of mostly expired 2024 events), Postman collection and old screenshots.

### Security
- Fixed authentication bypass: the 1.x API accepted the literal token `gg` as a valid session.
- Fixed unauthenticated account and trip deletion, and missing ownership checks on user and trip routes.
- Fixed Google sign-in trusting an email address sent by the browser; ID tokens are now verified server-side.
- Visitor accounts and passwords are gone entirely: the server holds no visitor data, so there is nothing to leak and no sign-up to abuse. Only administrators have sessions (HttpOnly, SameSite cookies, server-side revocation).
- Request logs no longer contain headers or cookies; OAuth codes are stripped from logged URLs.
- Manual data refreshes require a shared secret between backend and geo service (`SERVICE_PASSWORD_GEOADMIN`), on top of the private network.
- Added rate limiting (sign-in, routing, places), origin checks on state-changing requests, strict security headers and a Content Security Policy without any third-party origin.

## [1.0.0] — 2024-05-07

Initial release, built at Epitech Marseille by Maxence Bonnici, Maxence Laporte, Meriem Boussaid and Federico Suarez.

### Added
- React + Ant Design interface, Node.js/Express API, Python data service using DataTourisme, MariaDB.
- Start and destination search, steps, Leaflet map with Thunderforest styles, route display.
- Accounts with Google login, saved trips, favourites and a trips gallery.
- Swagger documentation and Jasmine tests.

[Unreleased]: https://github.com/ImMaxence/Epic-Road-Trip-Planner/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/ImMaxence/Epic-Road-Trip-Planner/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/ImMaxence/Epic-Road-Trip-Planner/releases/tag/v1.0.0
