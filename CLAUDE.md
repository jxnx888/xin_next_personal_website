# CLAUDE.md — Xin Ning Personal Website

Personal portfolio site. Next.js 16, TypeScript, Three.js, next-intl (en/zh), dark-only design.

This file is loaded into every session in full, so it holds only the rules every session
needs plus a map of `docs/`. Details live in `docs/` — read the relevant file before
working in that area.

---

## Collaboration Preferences

- **Always reply to the user in Chinese (中文).** Never slip in English or Japanese filler words/phrases in the reply text. Code identifiers, file paths, and proper nouns (`Notion`, `ESLint`, etc.) can stay as-is, but surrounding explanations must be Chinese.
- **Never run `git commit` unless the user explicitly asks for it** (e.g. "commit", "帮我commit", "提交一下"). The user wants to review all changes themselves before they are committed — stop at the file edits and wait.

---

## Doc Map

| File | Read it when |
|---|---|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Touching data loading, the blog (Notion/JSON, caching), i18n, navigation, Three.js pages — or looking for where a file lives (file map) |
| [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md) | Adding a project, an interactive page, a Roblox game, a nav item or translations; design tokens |
| [`docs/PITFALLS.md`](docs/PITFALLS.md) | Before changing Three.js decals/HeroWave, `ScrollMenu`, mock data shapes, or running repeated builds |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | Asked "what next?", or about to "clean up" a warning/deprecation — it may be deliberately deferred |
| [`docs/CHANGELOG.md`](docs/CHANGELOG.md) | Need the *why* behind past changes |
| [`docs/SEO_AUDIT.md`](docs/SEO_AUDIT.md) | SEO work |
| `README.md` | Env vars, routes, deployment, publishing blog changes |

**Wrapping up a change:** update the doc that owns what you changed (route → ARCHITECTURE
file map, new rule → CONVENTIONS, bug → PITFALLS) and add a `docs/CHANGELOG.md` entry, in
the same commit.

---

## Rules that apply everywhere

- **SSR pattern:** every page = Server Component (data, metadata) + Client Component
  (interactivity). Never fetch server-renderable content on the client.
- **Both locales, always:** `messages/en.json` + `zh.json` keys stay 1:1; content JSON comes
  in pairs (`foo.json` + `fooCN.json`). UI strings go in `messages/`, content in `public/mock/`.
- **Blog has two data sources** (Notion or local JSON). A blog shape change updates
  **both** paths. Use the cheapest shape that covers what you render. Cache with Next's
  Data Cache, never a module-level `Map`.
- **Colors only via CSS custom properties** — never hardcode hex.
- **Three.js state lives in closure variables** inside the effect, not React state.

---

## Git Workflow

- Active branch: `develop`. Features go here, PR into `master`.
- Commit style: `feat(scope):`, `fix(scope):`, `chore:`, `docs:` — concise, imperative.
- Always push `develop` before creating a PR.
- **Before every commit: run `/pre-commit` (ESLint + tsc).** Fix all Errors before committing. Warnings in Three.js client files (`*Client.tsx`, `*Loader.tsx`) for `<img>` are acceptable — suppress with `eslint-disable-next-line` if needed.
- Linting is `npm run lint` (ESLint CLI, flat config). `next lint` was removed in Next 16, and `next build` no longer lints — a lint error will **not** fail the build, so the check has to be run explicitly.

---

## Environment

Copy `.env.example` → `.env.local`. Full table in `README.md`. The site boots with
zero env vars; the two behaviours that change are:

- No `ELASTIC_EMAIL_API_KEY` → `POST /api/contact` returns 500.
- No `NOTION_TOKEN` + `NOTION_BLOG_DB_ID` → blog reads `public/mock/blogEN.json` /
  `blogCN.json` instead of Notion.

When testing blog changes, be explicit about which branch you are on.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
