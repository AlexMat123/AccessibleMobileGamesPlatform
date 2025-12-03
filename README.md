# Team 13 Group Project

Accessible games catalogue with voice navigation, JWT auth, reviews, recommendations, and accessibility personalisation. This README is structured to meet the module documentation requirements.

## What the project delivers (requirements)
- Search and browse games with accessibility/genre tags, debounced server search, shareable filters, and keyboard-friendly controls (`frontend/src/pages/Search.jsx`, `backend/routes/library.js`).
- JWT auth for register/login plus profile editing, password change, and helpful-vote stats (`backend/routes/auth.js`, `backend/routes/users.js`, `frontend/src/pages/Login.jsx`, `Signup.jsx`, `Profile.jsx`).
- Accessibility preferences stored per user and used for recommendations (`/api/users/:id/accessibility-preferences`, `/api/users/:id/recommended-games`, consumed on Home/Profile).
- Voice control across pages (wake word, search/filter, navigation, auth spelling, game actions) with a backend heuristic intent API and frontend command parser (`backend/routes/voice.js`, `frontend/public/voice/*`).
- Reviews with voting, follows/wishlist, and admin game reports (submit, resolve, delete games) (`backend/routes/games.js`, `frontend/src/pages/Game.jsx`, `Library.jsx`, `Reports.jsx`).
- Documented HTTP contract via `backend/openapi.yaml` and `/api-docs`; Postman collection in `backend/postman/`.

## Stack and why (with docs)
- [React](https://react.dev/) + [React Router](https://reactrouter.com/): component-driven UI and client routing for keyboard/screen-reader friendly flows.
- [Vite](https://vitejs.dev/): fast dev server and build pipeline.
- [Tailwind CSS](https://tailwindcss.com/) + [Headless UI](https://headlessui.com/) + [Heroicons](https://heroicons.com/): composable, accessible primitives and utility styling tokens.
- [Express 5](https://expressjs.com/) + [cors](https://github.com/expressjs/cors): lightweight JSON API with CORS for the Vite dev server.
- [Sequelize](https://sequelize.org/) on [MariaDB](https://mariadb.org/): ORM with a SQLite test dialect for hermetic integration tests.
- [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) + [bcrypt](https://github.com/kelektiv/node.bcrypt.js/): stateless auth and password hashing.
- [Swagger UI Express](https://www.npmjs.com/package/swagger-ui-express) + [swagger-cli](https://www.npmjs.com/package/swagger-cli): serve and validate the OpenAPI spec.
- [Jest](https://jestjs.io/) + [Supertest](https://github.com/visionmedia/supertest): backend unit/integration coverage.
- [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) + [jsdom](https://github.com/jsdom/jsdom): frontend behavioural tests.
- [Docker/Compose](https://docs.docker.com/compose/): local dev/prod-like orchestration with MariaDB.
- Web Speech API (built into Chromium) for client-side voice capture; optional backend LLM hook is stubbed via env vars.

## Prerequisites
- Node.js 20+ and npm.
- MariaDB running locally with a user that can create databases (defaults in `backend/.env`: host 127.0.0.1, port 3306, user `root`, password `comsc`, database `accessible-games`; change the DB name if your server dislikes the `@` character).
- Windows users: PowerShell or Cmd to run `start.ps1` / `start.bat`.
- Optional: Docker Desktop/Engine with Compose v2; microphone + Chrome/Edge for voice.

## Install dependencies
1) Install root tooling (concurrently, sqlite3, swagger-cli, newman): `npm install`
2) Install backend deps: `npm install --prefix backend`
3) Install frontend deps: `npm install --prefix frontend`
Windows one-shot (installs everything and launches dev servers): `./start.ps1` or `start.bat`.

## Configuration
- Backend env (`backend/.env`):
  - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`: MariaDB connection (user must be allowed to create DBs; `createDatabaseIfNotExists` runs on boot).
  - `JWT_SECRET`: required for auth.
  - `PORT`: API port (default 5000).
  - Optional voice LLM (off by default): `VOICE_LLM_MODEL`, `VOICE_LLM_HOST` (Ollama-style).
- Frontend env: `VITE_API_BASE` (defaults to `http://localhost:5000/api`). Voice remote override is also available at runtime via `window.VOICE_API_BASE`.
- Data seeding: `backend/config/seedGames.js` runs on server start; seeds tags, games, users (for example admin/adminPass123), and reviews. Idempotent on restart.

## Run the app (build/start/run/compile)
- Local dev (both servers with hot reload): `npm run dev`
  - Frontend: http://localhost:5173
  - API: http://localhost:5000/api and Swagger UI at http://localhost:5000/api-docs
- Run individually: `npm run dev --prefix backend` and `npm run dev --prefix frontend`.
- Production-like build: `npm --prefix frontend run build` then serve `frontend/dist` (for example with `frontend.Dockerfile`). Backend prod start: `npm --prefix backend start`.
- Docker dev (nodemon + Vite): `docker compose -f docker-compose.dev.yml up --build`
- Docker prod-like (Nginx + built frontend): `docker compose up --build` (frontend on http://localhost:8080, API on http://localhost:5000/api).
- Quick smoke checks once running:
  - `curl http://localhost:5000/api/tag-groups`
  - `curl http://localhost:5000/api/games`
  - `curl -X POST http://localhost:5000/api/voice/interpret -H "Content-Type: application/json" -d "{\"transcript\":\"hey platform show puzzle games\"}"`

## Scripts and tooling (what they do)
- Root `package.json`: `dev` (concurrently frontend+backend), `test` (backend SQLite integration + frontend), `test:postman` (boots backend on SQLite then runs Newman), `setup` (install subprojects), `start` (setup + dev), coverage helpers.
- Backend `package.json`: `dev` (nodemon server), `start` (node server), `test` (Jest on MariaDB), `test:int` (SQLite in-memory integration), `coverage*` variants.
- Frontend `package.json`: `dev`, `build`, `preview`, `lint`, `test` / `test:watch`, `coverage`.

## Testing and QA
- Full suite (what CI runs): `npm test`
- Backend (MariaDB): `npm run test:backend`; hermetic SQLite: `npm run test:backend:int`
- Frontend: `npm run test:frontend` (watch: `npm run test:frontend:watch`)
- OpenAPI validation: `npx swagger-cli validate backend/openapi.yaml`
- Postman smoke: `npm run test:postman` (auto-starts backend on SQLite, runs `backend/postman/backend-api.postman_collection.json` with `backend/postman/local.postman_environment.json`)
- Coverage reports: backend `backend/coverage/`, frontend `frontend/coverage/index.html` after running coverage scripts.

## Voice and accessibility specifics
- Wake word default is "hey platform"; configurable in Settings or via stored `appSettings`. Web Speech API gating keeps the mic listening and dispatches `voiceCommand` events.
- Frontend voice modules live in `frontend/public/voice/` (listener, parser, feedback, dispatcher); pages implement handlers (Search, Game, Library, Login/Signup spelling, Settings, Profile).
- Backend heuristic endpoint: `POST /api/voice/interpret { transcript } -> { intent|null }` (`backend/voice/intent.js`). Optional LLM vars exist but are commented out; behaviour is deterministic/heuristic by default.
- Tokens are kept in `localStorage`; use HTTPS in production.

## Assumptions and constraints
- MariaDB user can create databases; `sequelize.sync()` uses the live schema without destructive migrations.
- Seeded sample data is expected; deleting seed rows may affect tests, recommendations, and search coverage.
- Library favourites/wishlist in `Library.jsx` are persisted client-side per user via `localStorage`; follow/unfollow also exists server-side (`/api/users/:id/follow*`).
- Voice control requires a Chromium browser with mic permission; no offline STT fallback beyond Web Speech.
- Default DB name in `backend/.env` includes `@`; change if your MariaDB disallows it.
- JWTs stored in `localStorage` imply HTTPS and secure contexts in production.

## Onboarding resources (docs/wiki equivalents)
- API contract: `backend/openapi.yaml`, live at `/api-docs`, JSON at `/openapi.json`.
- Test suites: backend Jest specs in `backend/tests/`, frontend Vitest specs in `frontend/src/test/` (including voice parser tests).
- Postman: `backend/postman/backend-api.postman_collection.json` + `backend/postman/local.postman_environment.json`.
- Voice modules and intents: `frontend/public/voice/command-parser.js`, `frontend/public/voice/voice-controller.js`, backend counterpart `backend/voice/intent.js`.
- Helper scripts: `start.ps1` / `start.bat` for Windows bootstrap; `scripts/run-postman.js` automates smoke testing.
- CI pipelines: `.github/workflows/ci.yml` (GitHub) and `.gitlab-ci.yml` (GitLab) document expected commands and artifacts.

## Feature snapshot
- Search: accessibility tag groups (`backend/models/tags.js`), debounced server search, keyboard-friendly filters, sort, and voice-driven toggles.
- Game detail: carousel, follows, wishlist, reviews with voting, caption-aware media, report submission, and extensive voice actions (open reviews, set rating/comment, next/previous media).
- Home: featured games plus recommendations based on stored accessibility preferences.
- Settings: text size, spacing, button size, theme/light-dark/high-contrast, captions, visual alerts, wake word enable/word, reduce motion; all persisted to `localStorage`.
- Profile: edit username/email, change password, view reviews/follows/recommendations/helpful votes, update accessibility preferences (writes to backend).
- Reports: admin-only view to resolve/delete games linked to reports.