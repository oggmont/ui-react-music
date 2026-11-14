# ui-react-music

**Runlist**, the React web UI of the music-db playlist platform: search the catalog, collect songs into playlists, favorite the best ones, and keep five on your profile. It's a single-page app that talks to the Spring REST API in [restapi-spring-music](https://github.com/oggmont/restapi-spring-music).

**The design comes first.** Everything here follows [design-music-system](https://github.com/oggmont/design-music-system):

| Design document                                                                                         | What it decides here                                                      |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| [UI-Design.md](https://github.com/oggmont/design-music-system/blob/main/UI-Design.md)                   | Screens S1–S8, routes, product rules (BR-01…BR-15), decisions (D-01…D-13) |
| [ui/Design-System.md](https://github.com/oggmont/design-music-system/blob/main/ui/Design-System.md)     | Tokens, type, components and their states, copy (Proposal A, _Sleeve_)    |
| [ui/mockups/index.html](https://github.com/oggmont/design-music-system/blob/main/ui/mockups/index.html) | Clickable high-fidelity mockups of every screen                           |
| [API-Design.md](https://github.com/oggmont/design-music-system/blob/main/API-Design.md)                 | The API contract: endpoints, errors, JWT tokens, `ETag` / `If-Match`      |

> **Scope:** every screen works on a desktop, a tablet and a phone, as [UI-Design.md § Responsive behavior](https://github.com/oggmont/design-music-system/blob/main/UI-Design.md#responsive-behavior) describes. See [Phone and tablet](#phone-and-tablet).

## Contents

- [Stack](#stack)
- [Requirements](#requirements)
- [Quick start (Docker)](#quick-start-docker)
- [Local development](#local-development)
- [Scripts](#scripts)
- [Configuration](#configuration)
- [How it connects to the API](#how-it-connects-to-the-api)
- [Screens and routes](#screens-and-routes)
- [Phone and tablet](#phone-and-tablet)
- [Project layout](#project-layout)
- [Conventions](#conventions)
- [Tests](#tests)
- [Docker image](#docker-image)
- [Deployment (Google Cloud)](#deployment-google-cloud)
- [Troubleshooting](#troubleshooting)

## Stack

| Concern               | Choice                                                                         | Why                                                                            |
| --------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| UI library            | **React 19.3** with the **React Compiler** (v1)                                | Automatic memoization; no hand-written `useMemo`/`useCallback`                 |
| Build tool            | **Vite 8** (Rolldown)                                                          | The react.dev "build from scratch" path for an SPA in front of an existing API |
| Language              | **JavaScript** (JSX, ES modules)                                               |                                                                                |
| Routing               | **React Router 8**, data mode                                                  | Lazy, code-split routes; search state in the URL (`/songs?q=`)                 |
| Server state          | **TanStack Query 5**                                                           | Caching, cancelling stale searches, optimistic updates with rollback           |
| Accessible primitives | **Radix UI** (dialog, alert dialog, dropdown menu, toast)                      | Focus trapping, keyboard support and ARIA roles                                |
| Icons                 | **lucide-react**                                                               | The outline set named in the design system                                     |
| Styling               | **CSS Modules** + CSS variables (design tokens)                                | Scoped styles; tokens copied from the design system                            |
| Unit tests            | **Vitest 5**, **Testing Library**, **MSW 3**, jsdom                            | Fast tests with network calls mocked at the HTTP level                         |
| Quality               | **ESLint 10** (react-hooks incl. compiler rules, TanStack Query), **Prettier** |                                                                                |
| Runtime               | **Node.js 26** (LTS, see [.nvmrc](.nvmrc)); 22.12+ works                       |                                                                                |

## Requirements

- [Docker](https://docs.docker.com/get-docker/) with Compose v2
- The **API** running in Docker: [restapi-spring-music](https://github.com/oggmont/restapi-spring-music) (`make up` there), which in turn needs the database from [db-postgresql-music](https://github.com/oggmont/db-postgresql-music). The UI joins their Docker network, `music-db_default`.
- For development outside Docker: **Node.js 22.12 or newer** (26 recommended: `nvm use`, or `brew install node`).

Check that the API is up: `curl http://localhost:8081/actuator/health` should answer `{"status":"UP"}`.

## Quick start (Docker)

```bash
make env   # optional: creates .env from .env.example
make up    # docker compose up -d --build
```

Open **http://localhost:5173**. The source folder is mounted into the container, so edits hot-reload. `make logs` follows the log; `make down` stops it.

To get an account, use **Create an account** on the login page. The seed users (`ana.garcia`, `ben.carter`, …) have no password; an API admin can set one with `PUT /admin/users/{username}/password` (see the API's README).

|                                                  | URL                                                                              |
| ------------------------------------------------ | -------------------------------------------------------------------------------- |
| Web UI (dev server, hot reload)                  | http://localhost:5173                                                            |
| Web UI (production image, nginx): `make up-prod` | http://localhost:8082                                                            |
| API                                              | http://localhost:8081/api/v1 · Swagger UI: http://localhost:8081/swagger-ui.html |

## Local development

```bash
nvm use            # or any Node 22.12+
npm ci
npm run dev        # http://localhost:5173, /api is proxied to http://localhost:8081
```

The dev server proxies `/api` to `API_PROXY_TARGET` (default `http://localhost:8081`, the API's port on your machine). Recommended VS Code extensions are listed in [.vscode/extensions.json](.vscode/extensions.json) (ESLint, Prettier, Vitest, EditorConfig). In development, the TanStack Query devtools button sits in the bottom-left corner.

## Scripts

| npm                     | make                               | What it does                                                                           |
| ----------------------- | ---------------------------------- | -------------------------------------------------------------------------------------- |
| `npm run dev`           | `make dev`                         | Vite dev server with hot reload                                                        |
| `npm test`              | `make test-watch`                  | Unit tests in watch mode                                                               |
| `npm run test:run`      | `make test`                        | Unit tests once                                                                        |
| `npm run test:coverage` | `make coverage`                    | Unit tests with a coverage report in `coverage/`                                       |
| `npm run lint`          | `make lint`                        | ESLint                                                                                 |
| `npm run format`        | `make format`                      | Prettier (write); `format:check` only checks                                           |
| `npm run build`         | `make build`                       | Production bundle in `dist/`                                                           |
| `npm run preview`       | `make preview`                     | Serve `dist/` on http://localhost:4173 (with the `/api` proxy)                         |
| `npm run check`         | `make check`                       | Lint, format check, tests and build: what CI should run                                |
|                         | `make up` / `down` / `logs` / `sh` | Docker dev server                                                                      |
|                         | `make rebuild`                     | After changing `package.json`: rebuild the image and refresh its `node_modules` volume |
|                         | `make up-prod` / `down-prod`       | Production image (nginx)                                                               |

## Configuration

Settings come from environment variables, usually in `.env` (copy [.env.example](.env.example)). Both `npm run dev` and `docker compose` read it.

| Variable            | Default                 | Meaning                                                                                                                                                   |
| ------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `API_PROXY_TARGET`  | `http://localhost:8081` | Where the dev server forwards `/api` (local runs)                                                                                                         |
| `API_DOCKER_TARGET` | `http://music-api:8080` | Same, in Docker: the API's container on the shared network                                                                                                |
| `UI_PORT`           | `5173`                  | Host port of the Docker dev server                                                                                                                        |
| `UI_PROD_PORT`      | `8082`                  | Host port of the production image                                                                                                                         |
| `ALLOWED_HOSTS`     | –                       | Extra host names allowed to open the dev server (comma-separated). `music-ui` (the container name) is always allowed, for e2e tests on the Docker network |
| `WATCH_POLLING`     | `false`                 | Use polling if hot reload misses file changes in Docker                                                                                                   |
| `MUSIC_DB_NETWORK`  | `music-db_default`      | Docker network shared with the API and database                                                                                                           |
| `VITE_API_BASE_URL` | `/api/v1`               | API base URL baked into the bundle. Leave it unset to call the same origin (recommended)                                                                  |

Only `VITE_`-prefixed variables reach the browser bundle; never put secrets in them.

## How it connects to the API

```
Browser ──► http://localhost:5173  (Vite dev server, container "music-ui")
               │  /api/*  proxied, same origin: no CORS
               ▼
            http://music-api:8080/api/v1   (Spring API, container "music-api")
               ▼
            music-db-postgres:5432
```

- **Same origin.** The browser only talks to the UI's origin. The Vite dev server (and nginx in the production image) forwards `/api` to the API and drops the `Origin` header, so the API's CORS allow-list doesn't matter for the UI. That's safe because the API uses bearer tokens, not cookies.
- **Authentication (D-01, D-11).** `POST /auth/login` returns a 15-minute JWT and a single-use refresh token. The **access token stays in memory**. The **refresh token is kept in `sessionStorage`** so a reload keeps you signed in; it never goes to `localStorage` and is cleared when the tab closes. One wrapper, [src/api/client.js](src/api/client.js), adds `Authorization: Bearer`, refreshes about 30 s before expiry, and retries once after a `401`. Refreshes are **single-flight**: the API revokes the whole session when a refresh token is presented twice, so parallel requests (and React StrictMode's double effects) share one refresh. When the refresh fails, the session ends and you're sent to Login.
- **Optimistic locking.** Track-list writes and edits send `If-Match: "<version>"`. Adding a song retries once on `412` (appending is safe); removing a song or editing details reloads and tells you.
- **Errors** use the API's envelope `{ error: { code, message, details[] } }`, surfaced as `ApiError` (`status`, `code`, `details`). Codes map to the design's copy: `invalid_credentials`, `username_taken`, `email_taken`, `weak_password`, `playlist_full`, `playlist_limit_reached`, `favorite_limit_reached`, and so on.
- **Words.** The UI says _song_ and _favorite_; the API says _track_ and _follow_ (UI-Design.md § Vocabulary).

| Screen                | API calls                                                                                                                                                                                     |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1 Login / S2 Sign up | `POST /auth/login`, `GET /me`, `GET /reference/countries`, `POST /users`, `POST /auth/refresh`, `POST /auth/logout`                                                                           |
| S3 Home               | `GET /me/following/playlists?sort=name`, `GET /tracks/random?limit=6`, `GET /playlists/random?limit=4`, `GET /me/playlists?role=owner`                                                        |
| S4 Songs              | `GET /tracks/random?limit=20&exclude=…`, `GET /tracks?q=…&limit=20&offset=…`; add menu: `GET /me/playlists?role=owner&sort=name&contains_track=…`, `POST /playlists/{id}/tracks` + `If-Match` |
| S5 Create playlist    | `POST /playlists { name, description, track_ids? }` (always private)                                                                                                                          |
| S6 Discover           | `GET /playlists/random?limit=12&exclude=…`, `PUT`/`DELETE /me/following/playlists/{id}` (with `{ replaces }` to swap)                                                                         |
| S7 Playlist           | `GET /playlists/{id}`, `GET /playlists/{id}/tracks`, `PATCH /playlists/{id}`, `DELETE /playlists/{id}`, `DELETE /playlists/{id}/tracks/{position}`                                            |
| S8 Profile            | `GET /users/{username}`, `GET /users/{username}/favorites?sort=name`                                                                                                                          |

## Screens and routes

| Route                          | Screen                                                                         | Signed in?                                             |
| ------------------------------ | ------------------------------------------------------------------------------ | ------------------------------------------------------ |
| `/login`, `/signup`            | S1 Login, S2 Sign up                                                           | no (signed-in people go Home)                          |
| `/`                            | S3 Home: favorites, songs for you, playlists to discover, your other playlists | yes                                                    |
| `/songs`, `/songs?q=daft+punk` | S4 Songs: random songs and search, add to playlist                             | yes                                                    |
| `/discover`                    | S6 Discover playlists                                                          | yes                                                    |
| `/playlists/:id`               | S7 Playlist                                                                    | no for public playlists (shared links work signed out) |
| `/u/:username`                 | S8 Profile                                                                     | no                                                     |
| `/me`                          | Redirects to `/u/{your username}`                                              | yes                                                    |

S5 _Create playlist_, _Edit details_, _Replace a favorite_ and _Last favorite_ are dialogs, not routes. Every product rule is shown before the API enforces it: 5 favorites, 20 songs per playlist, 20 playlists, new playlists private, visibility follows favorites.

## Phone and tablet

The layout follows [UI-Design.md § Responsive behavior](https://github.com/oggmont/design-music-system/blob/main/UI-Design.md#responsive-behavior) and the phone frames of the [mockups](https://github.com/oggmont/design-music-system/blob/main/ui/mockups/index.html). It's done in CSS: plain media queries, with the breakpoints written out because CSS variables can't be used in a media query. The one exception is the tab bar, a separate component.

| Width                    | What changes                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| under 640 px (phone)     | Bottom tab bar **Home · Songs · Discover · Me** ([TabBar.jsx](src/app/layout/TabBar.jsx)). The top bar keeps the logo and a **+** for New playlist. 16 px gutters. The five favorites and Home's "Playlists to discover" scroll sideways; other grids have 2 columns. Song rows have two lines (title, then artist · album). Menus open as bottom sheets, dialogs take the full screen, and toasts sit above the tab bar. |
| 640–1023 px (tablet)     | Top bar. Grids have 3 columns. Below 800 px the nav links lose their icons and New playlist is a **+**, so the bar fits.                                                                                                                                                                                                                                                                                                  |
| 1024 px and up (desktop) | Top bar, content at most 1200 px wide (unchanged).                                                                                                                                                                                                                                                                                                                                                                        |

How some of it works:

- **Bottom sheets.** Every Radix `DropdownMenu.Content` carries the global class `sheet-on-phone`. Under 640 px, [global.css](src/styles/global.css) overrides the inline styles Radix puts on its popper wrapper, so the menu sits at the bottom with a grab handle and a scrim. A tap on the scrim is a tap outside the menu, so it closes. Keyboard handling, roles and focus stay the menu's own. A new menu needs that class too.
- **Log out on a phone.** The account menu (avatar) is hidden on a phone, as in the mockups, so your own profile, the **Me** tab, has a **Log out** button. It's shown only under 640 px. The mockups have no log out on a phone, so this is a proposed design addition.
- **iPhone details.** `viewport-fit=cover`, with `env(safe-area-inset-*)` keeping the header, tab bar, sheets and dialogs clear of the notch and home indicator. Fields use 16 px text, because Safari zooms into smaller ones. Hover effects on song rows, cards, hearts and the Add button only apply on devices that can hover, so a tap doesn't leave them highlighted. Touch targets are 44 px.
- **Add to Home Screen.** [public/manifest.webmanifest](public/manifest.webmanifest) and `apple-touch-icon.png` make Runlist open full screen with its own icon. The session lasts as long as the tab (D-11), so fully closing the app can sign you out.

To try it, open the dev server in your browser's device mode at 390 px wide. To use a real phone on the same network, run `npm run dev -- --host` and open `http://<your computer's IP>:5173`. Host names other than `localhost` need `ALLOWED_HOSTS`. The deployed version is at the URL in [Deployment (Google Cloud)](#deployment-google-cloud).

## Project layout

```
src/
├── main.jsx                 entry: StrictMode + <App>
├── app/
│   ├── App.jsx              providers: QueryClient → Toast → Auth → Router
│   ├── routes.jsx           route table (lazy, code-split pages)
│   ├── queryClient.js       TanStack Query defaults
│   └── layout/              header, tab bar (phone), layouts, route guards, error boundary
├── api/
│   ├── client.js            fetch wrapper: tokens, refresh, If-Match, ApiError
│   ├── session.js           where tokens live (memory / sessionStorage)
│   ├── endpoints.js         every API call the UI makes
│   └── queryKeys.js         query keys, in one place
├── features/
│   ├── auth/                AuthProvider + useAuth
│   ├── favorites/           FavoritesProvider (the only place that favorites), hearts, Replace dialog
│   ├── playlists/           add-to-playlist menu, create/edit dialog, optimistic add
│   └── toast/               ToastProvider + useToast
├── components/              shared UI: Button, Field, Modal, Cover, Avatar, PlaylistCard, SongList, …
├── pages/                   one module per screen (S1–S8)
├── lib/                     pure logic: product rules, formatting, covers, validation (unit-tested)
├── styles/                  tokens.css (design tokens), global.css
└── test/                    Vitest setup, MSW server, fixtures, render helpers
```

## Conventions

- **Responsive in CSS.** Each module adds its own `@media (max-width: 639.98px)` (phone) and `(max-width: 1023.98px)` (tablet) rules next to the desktop ones, and hover styles go inside `@media (hover: hover)`. Menus need `sheet-on-phone` (see [Phone and tablet](#phone-and-tablet)).
- **Design tokens only.** Components use the semantic CSS variables in [src/styles/tokens.css](src/styles/tokens.css) (`--c-accent`, `--r-panel`, …), never raw colors.
- **CSS Modules scope `@keyframes`.** Define the keyframes inside the module that uses them, because a global name won't resolve. Radix waits for `animationend` on close, so a missing animation leaves menus and dialogs open.
- **Server state lives in TanStack Query**, keyed by [src/api/queryKeys.js](src/api/queryKeys.js). After a write, invalidate the keys it affects.
- **Product rules are pure functions** in [src/lib/rules.js](src/lib/rules.js) (visibility badge, replace consequences, add-menu order), so they're easy to test.
- **Copy follows the design system**: "song", "favorite", "by you"; errors say what went wrong and how to fix it.
- **Accessibility target WCAG 2.2 AA**: labelled fields with linked errors, `aria-pressed` hearts named after the playlist, `aria-current` navigation, focus-trapped dialogs, toasts in a live region, and `prefers-reduced-motion`.
- Imports use the `@/` alias for `src/`. Formatting is Prettier's; run `npm run check` before pushing.

## Tests

Unit tests only (`*.test.js` / `*.test.jsx` next to the code). End-to-end tests (Selenium/Cypress) live in a separate repository.

```bash
npm run test:run       # once
npm test               # watch mode
npm run test:coverage  # coverage report in coverage/
```

- **Pure logic**: formatting, covers, product rules, add-menu ordering, sign-up validation.
- **API client**: bearer token, `If-Match`, error envelope, network errors, a single-flight refresh for parallel requests, retry after `401`, and the session ending when the refresh fails.
- **Components and pages**: rendered through the real providers and routes, with the network mocked by [MSW](https://mswjs.io): login (validation, wrong password, redirect back), sign-up (username suggestion, blur checks, `username_taken`), the create/edit dialog (disabled states, discard confirmation, `412` reload), favoriting (toast copy, the Replace dialog at 5 of 5), and the phone layout (tab bar and the current tab, log out from Me, two-line song rows, menus marked as bottom sheets).
- **Layout itself** isn't something jsdom can check (it applies no CSS). Check it in a browser at 390 px (phone), 700 px (tablet) and 1280 px (desktop).

Every request in a test must be mocked; an unmocked request fails the test.

**For e2e tests:** the dev server answers on the Docker network at `http://music-ui:5173`, and the production image at `http://music-ui-prod:8080` (with `--profile prod`). Use `ALLOWED_HOSTS` for any other host name.

## Docker image

[Dockerfile](Dockerfile) has three targets:

| Target  | What it is                                                                                                                                                                                                                                                                                                |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dev`   | Node 26 + `npm ci`; runs the Vite dev server. Compose mounts the source and keeps `node_modules` in a named volume, so the container's Linux binaries don't mix with your machine's.                                                                                                                      |
| `build` | Runs **lint and unit tests**, then `vite build`; a failing test fails the image build.                                                                                                                                                                                                                    |
| `prod`  | `nginx-unprivileged` (non-root, port 8080) serving `dist/`: SPA fallback to `index.html`, long-term caching for hashed assets, `/api` proxied to `API_UPSTREAM` (default `http://music-api:8080`, resolved per request so nginx starts even when the API is down), basic security headers and `/healthz`. |

```bash
docker build --target prod -t ui-react-music .
docker run --rm -p 8082:8080 --network music-db_default ui-react-music
```

nginx sends the upstream's host name as `Host` and SNI, so `API_UPSTREAM` can also be an HTTPS URL such as the API's Cloud Run address.

## Deployment (Google Cloud)

The UI runs on Cloud Run at **https://runlist-ui-894040023319.us-central1.run.app**, inside the GCP free tier. It's the `prod` image, with `API_UPSTREAM` set to the API's Cloud Run URL.

[.github/workflows/deploy.yml](.github/workflows/deploy.yml) does the following:

- **On every push and pull request:** runs `npm run check`.
- **On pushes to `main`, or when you run it by hand:** builds the `prod` image, pushes it to Artifact Registry (`us-central1-docker.pkg.dev/runlist-514701/runlist/ui`) and deploys the Cloud Run service `runlist-ui`.

The service has 1 vCPU and 256 MiB, scales from 0 to 2 instances and is billed per request. The workflow authenticates without keys, through Workload Identity Federation.

The UI is the platform's only public entry point:

- **Reaching the API:** all its outbound traffic goes through the VPC (Direct VPC egress), which is the only way in, because the API's ingress is internal.
- **Rate limiting:** nginx limits log in, refresh and sign-up to 10 a minute per client IP (burst 10, then `429`). The client IP is the last `X-Forwarded-For` entry, which Cloud Run sets.
- **Headers:** nginx adds HSTS and hides its version.

The project's infrastructure (API, database VM, registry, service accounts, budget alert), its costs, and what to avoid so it stays free are in db-postgresql-runlist's [deploy/gcp/README.md](https://github.com/oggmont/db-postgresql-runlist/blob/main/deploy/gcp/README.md).

The first page after a quiet period can take a few seconds, while Cloud Run starts the UI and the API.

## Troubleshooting

| Problem                                         | Fix                                                                                              |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `network music-db_default not found`            | Start the database and API first (`make up` in db-postgresql-music and restapi-spring-music).    |
| Pages load but data doesn't (502/504 on `/api`) | The API isn't running or isn't healthy: `docker ps`, then `curl localhost:8081/actuator/health`. |
| `403` on the dev server from another host name  | Vite only allows `localhost` and `music-ui`. Add the host to `ALLOWED_HOSTS`.                    |
| Hot reload misses changes in Docker             | Set `WATCH_POLLING=true` in `.env` and `make up`.                                                |
| Dependency changes don't show up in Docker      | `make rebuild` (the `node_modules` volume keeps the old install).                                |
| Signed out after every new tab                  | By design: the refresh token is per tab (`sessionStorage`).                                      |
