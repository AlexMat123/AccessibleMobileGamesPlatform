# Team 13 Group Project



## Prerequisites

- Node.js 20+ and npm.
- MariaDB running locally with a user that can create databases (defaults in `backend/.env`: host 127.0.0.1, port 3306, user `root`, password `comsc`, database `accessible-games`).
- PowerShell or Cmd on Windows for the helper scripts.

## Install

1. Install root tooling (concurrently, sqlite for tests): `npm install`
2. Install backend dependencies: `npm install --prefix backend`
3. Install frontend dependencies: `npm install --prefix frontend`
4. One-shot on Windows: run `./start.ps1` (PowerShell) or `start.bat` (Cmd) from the project root to install everything and launch dev servers.

## Run

- Ensure MariaDB is running and credentials in `backend/.env` are correct. The server will create the database if needed and seed sample data on startup.
- Start both servers together: `npm run dev` (frontend on http://localhost:5173, backend API on http://localhost:5000/api).
- Or run individually: `npm run dev --prefix backend` and `npm run dev --prefix frontend`.
- Frontend uses `VITE_API_BASE` to point at the API (defaults to `http://localhost:5000/api`).

## Test

- Run everything the CI does: `npm test` (backend integration on SQLite + frontend tests).
- Backend (MariaDB, uses your `.env`): `npm run test:backend`.
- Backend hermetic/in-memory (SQLite, recommended locally): `npm run test:backend:int`.
- Frontend: `npm run test:frontend` or watch mode with `npm run test:frontend:watch`.

## Docker

- Prereqs: Docker Desktop/Engine with Compose v2 (`docker compose`).
- Dev (hot reload, Vite + nodemon): `docker compose -f docker-compose.dev.yml up --build`
  - Frontend: http://localhost:5173
  - API: http://localhost:5000/api
  - DB: MariaDB on localhost:3306 (persisted volume `db_data`)
- Prod-like build (Nginx + built frontend): `docker compose up --build`
  - Frontend: http://localhost:8080
  - API: http://localhost:5000/api
- Stop/clean: `docker compose -f docker-compose.dev.yml down` (or `docker compose down`) and add `-v` to drop DB volume.
- Manual smoke tests once containers are up:
  - Tag groups: `curl http://localhost:5000/api/tag-groups`
  - Games: `curl http://localhost:5000/api/games`
  - Voice intent: `curl -X POST http://localhost:5000/api/voice/interpret -H "Content-Type: application/json" -d '{"transcript":"hey platform show puzzle games"}'`

## Architecture assumptions

- Monorepo with an Express 5 API (`backend/`) and a Vite/React client (`frontend/`). Client calls the API via `frontend/src/api.js` and expects the base URL at `VITE_API_BASE` (defaults to `http://localhost:5000/api`).
- Data layer uses Sequelize 6 with MariaDB in development/production. `createDatabaseIfNotExists` assumes the DB user can create the database. `seedGames` runs at boot to ensure games/tags/users/reviews exist for search and testing.
- Authentication is stateless JWT; tokens are stored in `localStorage` on the client and sent as `Authorization: Bearer <token>`. HTTPS is expected in production to protect tokens.
- Tests can run without MariaDB by setting `DB_DIALECT=sqlite` (the `test:backend:int` script does this and seeds data automatically). MariaDB remains the runtime database.
- Voice intents are heuristic-only; optional LLM env vars in `backend/.env` are disabled by default.

## Frameworks and libraries (ILO3 rationale)

- [React](https://react.dev/) + [React Router](https://reactrouter.com/): component model and routing for accessible, stateful UI; mature ecosystem for keyboard/screen-reader patterns.
- [Vite](https://vitejs.dev/): fast dev server and HMR to shorten feedback loops and keep bundle config minimal.
- [Tailwind CSS](https://tailwindcss.com/): utility-first styling for consistent spacing/contrast tokens, reducing custom CSS and improving accessibility discipline.
- [Express](https://expressjs.com/): lightweight HTTP server with familiar middleware, good fit for a small JSON API.
- [Sequelize](https://sequelize.org/) on [MariaDB](https://mariadb.org/): ORM keeps queries portable and enables SQLite-backed tests while targeting MariaDB in production.
- [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) + [bcrypt](https://github.com/kelektiv/node.bcrypt.js/): widely used auth primitives for stateless JWT flows and password hashing.
- [Jest](https://jestjs.io/) + [Supertest](https://github.com/visionmedia/supertest): backend unit/integration tests that exercise the API surface.
- [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) + [jsdom](https://github.com/jsdom/jsdom): frontend tests focused on user-observable behavior and accessibility.
- [Headless UI](https://headlessui.com/) + [Heroicons](https://heroicons.com/): accessible UI primitives and icons without locking styling.
- [cors](https://github.com/expressjs/cors) + [dotenv](https://github.com/motdotla/dotenv): cross-origin API access from the frontend and environment-based config.
- [nodemon](https://nodemon.io/) + [concurrently](https://github.com/open-cli-tools/concurrently): faster backend reloads and running frontend/backend dev servers together.
- [sqlite3](https://www.npmjs.com/package/sqlite3) (dev only): lightweight DB driver for fast, hermetic backend integration tests.

Already a pro? Just edit this README.md and make it your own. Want to make it easy? [Use the template at the bottom](#editing-this-readme)!

## Features (quick links)

- [Search Page](#search-page-tags--accessibility): genre/accessibility filters, voice filters.
- [Voice Control](#voice-control-no-ai-required): wake word + intents.
- [Settings Page](#settings-page-accessibility--personalization): text size, captions/alerts, buttons/spacing, theme/high-contrast, wake word, reduce motion; voice-driven toggles.

## Add your files

- [ ] [Create](https://docs.gitlab.com/ee/user/project/repository/web_editor.html#create-a-file) or [upload](https://docs.gitlab.com/ee/user/project/repository/web_editor.html#upload-a-file) files
- [ ] [Add files using the command line](https://docs.gitlab.com/topics/git/add_files/#add-files-to-a-git-repository) or push an existing Git repository with the following command:

```
cd existing_repo
git remote add origin https://git.cardiff.ac.uk/c23055508/team-13-group-project.git
git branch -M main
git push -uf origin main
```

## Integrate with your tools

- [ ] [Set up project integrations](https://git.cardiff.ac.uk/c23055508/team-13-group-project/-/settings/integrations)

## Collaborate with your team

- [ ] [Invite team members and collaborators](https://docs.gitlab.com/ee/user/project/members/)
- [ ] [Create a new merge request](https://docs.gitlab.com/ee/user/project/merge_requests/creating_merge_requests.html)
- [ ] [Automatically close issues from merge requests](https://docs.gitlab.com/ee/user/project/issues/managing_issues.html#closing-issues-automatically)
- [ ] [Enable merge request approvals](https://docs.gitlab.com/ee/user/project/merge_requests/approvals/)
- [ ] [Set auto-merge](https://docs.gitlab.com/user/project/merge_requests/auto_merge/)

## Test and Deploy

Use the built-in continuous integration in GitLab.

- [ ] [Get started with GitLab CI/CD](https://docs.gitlab.com/ee/ci/quick_start/)
- [ ] [Analyze your code for known vulnerabilities with Static Application Security Testing (SAST)](https://docs.gitlab.com/ee/user/application_security/sast/)
- [ ] [Deploy to Kubernetes, Amazon EC2, or Amazon ECS using Auto Deploy](https://docs.gitlab.com/ee/topics/autodevops/requirements.html)
- [ ] [Use pull-based deployments for improved Kubernetes management](https://docs.gitlab.com/ee/user/clusters/agent/)
- [ ] [Set up protected environments](https://docs.gitlab.com/ee/ci/environments/protected_environments.html)

***

# Editing this README

When you're ready to make this README your own, just edit this file and use the handy template below (or feel free to structure it however you want - this is just a starting point!). Thanks to [makeareadme.com](https://www.makeareadme.com/) for this template.

## Suggestions for a good README

Every project is different, so consider which of these sections apply to yours. The sections used in the template are suggestions for most open source projects. Also keep in mind that while a README can be too long and detailed, too long is better than too short. If you think your README is too long, consider utilizing another form of documentation rather than cutting out information.

## Name
Choose a self-explaining name for your project.

## Description
Let people know what your project can do specifically. Provide context and add a link to any reference visitors might be unfamiliar with. A list of Features or a Background subsection can also be added here. If there are alternatives to your project, this is a good place to list differentiating factors.

## Badges
On some READMEs, you may see small images that convey metadata, such as whether or not all the tests are passing for the project. You can use Shields to add some to your README. Many services also have instructions for adding a badge.

## Visuals
Depending on what you are making, it can be a good idea to include screenshots or even a video (you'll frequently see GIFs rather than actual videos). Tools like ttygif can help, but check out Asciinema for a more sophisticated method.

## Installation
Within a particular ecosystem, there may be a common way of installing things, such as using Yarn, NuGet, or Homebrew. However, consider the possibility that whoever is reading your README is a novice and would like more guidance. Listing specific steps helps remove ambiguity and gets people to using your project as quickly as possible. If it only runs in a specific context like a particular programming language version or operating system or has dependencies that have to be installed manually, also add a Requirements subsection.

## Usage
Use examples liberally, and show the expected output if you can. It's helpful to have inline the smallest example of usage that you can demonstrate, while providing links to more sophisticated examples if they are too long to reasonably include in the README.

## Search Page (Tags + Accessibility)

The project includes an accessible Search page to filter games by genre and accessibility tags.

- Backend endpoints
  - `GET /api/tag-groups` – canonical groups and tag names from `backend/models/tags.js`
  - `GET /api/games` – games with associated tag names
- Voice Control (Heuristic, No AI Required)
  - Wake word: “Hey Platform” opens a brief listening window.
  - Supported intents: navigate (`go to search`), search (`search for puzzle games` / `show puzzle games`), filters (`filter by motor` / `apply filters colourblind mode and high contrast`), reset filters (`reset filters` / `clear filters`), scroll (`scroll up/down`).
  - Genre mentions alone trigger filters (e.g., “show puzzle games” → Puzzle filter).
  - Visual feedback: status banner; `voiceCommand` events dispatch to pages (Search page updates filters/tags/genre).
  - Frontend voice modules live in `frontend/public/voice/*`; `voiceCommand` handlers in `Search.jsx`.
  - Backend heuristic intent API: `POST /api/voice/interpret` → `{ intent|null }` (no model needed).
  - Run:
    - Backend: `npm --prefix backend run dev` (API on http://localhost:5000)
    - Frontend: `npm --prefix frontend run dev` (Vite on http://localhost:5173)
    - Frontend calls backend at `http://localhost:5000/api/voice/interpret` by default; override with `window.VOICE_API_BASE='http://localhost:5000/api'` if needed.
  - Manual checks:
    - API: `curl -X POST http://localhost:5000/api/voice/interpret -H "Content-Type: application/json" -d '{"transcript":"hey platform maybe show puzzle games"}'`
    - Console: `interpretTranscriptRemote('hey platform filter by motor').then(console.log);`
    - Dispatch event: `window.dispatchEvent(new CustomEvent('voiceCommand', { detail: { type:'filter', tag:'Puzzle' } }));`
    - Voice: say “Hey Platform, filter by colourblind mode” and watch filters update.
  - Tests:
    - Backend: `npm --prefix backend test` (includes `/api/voice/interpret`)
    - Frontend: `npm --prefix frontend test` (parser, event dispatch, Search page voice handler integration, plus page tests)
  - Optional AI/LLM: disabled by default; heuristic only. Ollama env placeholders exist in `backend/.env` (commented). Leave them commented to stay heuristic-only.
- Frontend route
  - `/search` – keyboard-only friendly page with labelled inputs, visible focus, and polite live status updates
- Keyboard usage
  - Tab/Shift+Tab to move focus; Enter/Space to toggle tag buttons
  - "Clear search & tags" resets input and selections
- Shareable filters
  - URL persists state: `?q=keyword&tags=Tag1,Tag2` (refresh/back/forward supported)
- Dev run
  - Backend: `npm run dev` in `backend/`
  - Frontend: `npm run dev` in `frontend/`, then open `/search`
- Seeding
  - Seeds are idempotent and cover all tags for realistic testing (`backend/config/seedGames.js`).

## Settings Page (accessibility + personalization)

- Route: `/settings` (frontend). Settings are stored in `localStorage` under `appSettings` (see `frontend/src/settings.js`).
- Controls: text size (small/medium/large) with live preview; captions always on; visual alerts; button size (normal/large/xlarge); spacing (snug/roomy/airy); wake word toggle + custom word; theme (light/dark); high contrast mode; reduce animation.
- Accessibility: focus-visible outlines on controls, role="switch" for toggles, labelled inputs, high-contrast friendly tones.
- Voice intents handled here: set-high-contrast-mode, set-wake-word-enabled, set-wake-word, set-text-size, set-reduce-motion, set-captions, set-visual-alerts, set-button-size, set-spacing. A `voiceCommand` event with one of these actions updates UI and persists the setting.
- Key files: `frontend/src/pages/Settings.jsx` (UI/logic) and `frontend/src/settings.js` (load/save defaults).

## Settings Page (accessibility + personalization)

- Route: `/settings` (frontend). Settings are stored in `localStorage` under `appSettings` (see `frontend/src/settings.js`).
- Controls: text size (small/medium/large) with live preview; captions always on; visual alerts; button size (normal/large/xlarge); spacing (snug/roomy/airy); wake word toggle + custom word; theme (light/dark); high contrast mode; reduce animation.
- Accessibility: focus-visible outlines on controls, role="switch" for toggles, labelled inputs, high-contrast friendly tones.
- Voice intents handled here: set-high-contrast-mode, set-wake-word-enabled, set-wake-word, set-text-size, set-reduce-motion, set-captions, set-visual-alerts, set-button-size, set-spacing. A `voiceCommand` event with one of these actions updates UI and persists the setting.
- Key files: `frontend/src/pages/Settings.jsx` (UI/logic) and `frontend/src/settings.js` (load/save defaults).

## Voice Control (no AI required)

- Wake word & intents
  - Wake word: “Hey Platform” opens a brief listening window.
  - Intents: navigate (`go to search`), search (`search/show puzzle games`), filters (`filter by motor`, `apply filters colourblind mode and high contrast`), reset filters, scroll up/down. Genre mentions alone trigger filters (e.g., “show puzzle games” → Puzzle).
- Architecture
  - Frontend voice modules: `frontend/public/voice/*` (parser, dispatcher, feedback). Pages listen for `voiceCommand` (e.g., `Search.jsx` applies filters/genre).
  - Backend heuristic intent API: `POST /api/voice/interpret` → `{ intent|null }` (no model needed).
- Run
  - Backend: `npm --prefix backend run dev` (API on http://localhost:5000)
  - Frontend: `npm --prefix frontend run dev` (http://localhost:5173). Frontend calls `http://localhost:5000/api/voice/interpret` by default; override with `window.VOICE_API_BASE='http://localhost:5000/api'` if needed.
- Manual checks
  - API: `curl -X POST http://localhost:5000/api/voice/interpret -H "Content-Type: application/json" -d '{"transcript":"hey platform maybe show puzzle games"}'`
  - Console: `interpretTranscriptRemote('hey platform filter by motor').then(console.log);`
  - Dispatch event: `window.dispatchEvent(new CustomEvent('voiceCommand', { detail: { type:'filter', tag:'Puzzle' } }));`
  - Voice: say “Hey Platform, filter by colourblind mode” and watch filters update.
 - Tests
  - Backend: `npm --prefix backend test` (includes `/api/voice/interpret`)
  - Frontend: `npm --prefix frontend test` (parser, `voiceCommand` dispatch, Search page voice handler integration, plus page tests)
 - Optional AI/LLM
   - Disabled by default; heuristic only. Ollama env placeholders exist in `backend/.env` (commented). Leave them commented to stay heuristic-only.

## Testing

- Backend tests (Jest)
  - Run all: `npm run test:backend`
  - What’s covered: tag-groups API, games API mapping, search query building (unit + opt-in SQLite integration).
  - Integration tests: use an in-memory SQLite DB via `DB_DIALECT=sqlite`. To run them locally, first install `sqlite3` in `backend` (`cd backend && npm install sqlite3 --save-dev`), then run `npm run test:backend:int` from the project root. MariaDB remains the main runtime database; SQLite is used only for fast, isolated tests.

- Frontend tests (Vitest + React Testing Library)
  - Run all: `npm run test:frontend`
  - Watch mode: `npm run test:frontend:watch`
  - What’s covered: Search page renders, keyboard accordion + tag toggles, debounced server search, loading status during in-flight requests, and selected genre/tags reflected in server calls.

- Manual API checks (PowerShell)
  - Tag groups: `Invoke-RestMethod http://localhost:5000/api/tag-groups | ConvertTo-Json -Depth 6`
  - All games: `Invoke-RestMethod http://localhost:5000/api/games | ConvertTo-Json -Depth 6`
  - Search: `Invoke-RestMethod "http://localhost:5000/api/games/search?q=puzzle&tags=Puzzle" | ConvertTo-Json -Depth 6`

## CI/CD (GitLab runner)

- Pipelines: `.gitlab-ci.yml` runs `npm test` (backend SQLite integration + frontend) then `npm --prefix frontend run build` and stores `frontend/dist` as an artifact. A GitHub Actions CI mirror lives in `.github/workflows/ci.yml`.
- GitLab runner (Windows, shell executor):
  1) Download `gitlab-runner-windows-amd64.exe` from GitLab docs; place in `C:\GitLab-Runner` and rename to `gitlab-runner.exe`.
  2) In admin PowerShell: `cd C:\GitLab-Runner` then `.\gitlab-runner.exe register --url https://git.cardiff.ac.uk --token <project-token>` → executor: `shell`, tags: leave empty (allow untagged jobs), description: `team13-node-runner` (or similar).
  3) Set `shell = "powershell"` in `C:\GitLab-Runner\config.toml` under your runner.
  4) In admin PowerShell: `.\gitlab-runner.exe install` then `.\gitlab-runner.exe start`.
- After pushing changes (`git push`), check `CI/CD → Pipelines` in GitLab; jobs should run on `team13-node-runner`.

## Support
Tell people where they can go to for help. It can be any combination of an issue tracker, a chat room, an email address, etc.

## Roadmap
If you have ideas for releases in the future, it is a good idea to list them in the README.

## Contributing
State if you are open to contributions and what your requirements are for accepting them.

For people who want to make changes to your project, it's helpful to have some documentation on how to get started. Perhaps there is a script that they should run or some environment variables that they need to set. Make these steps explicit. These instructions could also be useful to your future self.

You can also document commands to lint the code or run tests. These steps help to ensure high code quality and reduce the likelihood that the changes inadvertently break something. Having instructions for running tests is especially helpful if it requires external setup, such as starting a Selenium server for testing in a browser.

## Authors and acknowledgment
Show your appreciation to those who have contributed to the project.

## License
For open source projects, say how it is licensed.

## Project status
If you have run out of energy or time for your project, put a note at the top of the README saying that development has slowed down or stopped completely. Someone may choose to fork your project or volunteer to step in as a maintainer or owner, allowing your project to keep going. You can also make an explicit request for maintainers.

test pipeline
