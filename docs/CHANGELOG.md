# Changelog

What changed and **why**, newest first. The *what* is also in `git log`; this file is for
the reasoning that a commit subject can't hold. Add an entry in the same commit as the
change.

---

## 2026-10-08 — Docs moved into `docs/`

Project knowledge was split across `README.md`, `CLAUDE.md`, a root-level `SEO_AUDIT.md`
and notes that lived only in the AI assistant's private memory (the roadmap and the
"why we deferred this" list — invisible to anyone reading the repo). Consolidated into
`docs/`:

- `ARCHITECTURE.md`, `CONVENTIONS.md`, `PITFALLS.md` — split out of `CLAUDE.md`, which is
  now collaboration rules + a doc map. `CLAUDE.md` is loaded into every AI session in full,
  so it should hold what every session needs, not every detail.
- `ROADMAP.md`, `CHANGELOG.md` — new; seeded from git history and the memory notes.
- `SEO_AUDIT.md` — moved from the repo root.

Dropped from the roadmap: rebasing `feat/new-design` — that branch no longer exists
locally or on the remote.

## 2026-10-08 — Roblox games page (`6e50c5a`, `abe35fb`)

- New `/projects/roblox` page for **Spinning Slayers** and **Spinning Survivors**, the two
  Roblox games built while learning Roblox development. Newest release first.
- The "currently learning Roblox" intro lives on the **projects** page, not the games page
  — it's part of the portfolio story; the games page is just the games.
- New **Games** top-nav item. `Navigation.isActive` now picks the longest matching route;
  plain prefix matching lit up both Projects and Games on `/projects/roblox`.
- Slayers highlights were cut from 9 to 6 one-liners: the highlights card is a narrow
  column, and long items made it far taller than the description beside it.
- Projects side menu got a `Roblox` item, which exposed an old `ScrollMenu` bug: after a
  click the **previous** item stayed highlighted (always on mobile). See
  [`PITFALLS.md`](./PITFALLS.md).

## 2026-09-22 — Next.js 16 and blog caching (PR #12)

- Upgraded to Next.js 16; `middleware.ts` → `proxy.ts`; `next lint` removed, so linting
  moved to the ESLint CLI with a flat config. `next build` no longer lints — `/pre-commit`
  must run `npm run lint` explicitly.
- Blog data split into three shapes (`BlogIndexItem` / `BlogSummary` / `BlogPost`) so each
  caller pays only for what it renders. The sitemap had been fetching all 60 article bodies
  to read ids and dates; the blog list shipped every body to the browser (668 KB HTML).
- Notion bodies cached indefinitely in Next's Data Cache (tagged per post);
  `/api/revalidate` purges tags. Requests paced to ~3/s with 429 retry.
- A dozen verification builds that day rate-limited the shared Notion token and broke a
  Vercel preview — see [`PITFALLS.md`](./PITFALLS.md).

## 2026-09-21 — Cleanup

Removed dead code: the stale singular `lib/types/project.ts`, `lib/utils/projectUtils.ts`,
the never-wired `store/` (Zustand), GitHub Pages leftovers (`public/404.html`,
`public/CNAME`) and 4 orphaned mock JSONs. Uninstalled 10 unused deps (axios,
fireworks-js, lodash, moment, moment-timezone, qs, video.js, zustand, @types/lodash,
@types/qs). Upgraded next-intl to 4.14.6. README and CLAUDE.md rewritten.

## 2026-08 — SEO, analytics, branding

- SEO pass (2026-08-07): sitemap now includes Chinese-only posts, fuller `BlogPosting`
  JSON-LD, OG `publishedTime`/`authors`, PWA icons. Tracked in
  [`SEO_AUDIT.md`](./SEO_AUDIT.md).
- Vercel Analytics + Speed Insights.
- Blog: per-locale abstract derived from rendered content; Notion posts with a future
  publish date are hidden.
- Logo images; profile avatar on the home About Me card.

## 2026-07 — Rebuild on Next.js

- Migrated from the Vue 2 site (`xin_vue_personal_website`) to Next.js + TypeScript with a
  full visual redesign.
- Blog and projects converted to SSR (Server Components); 7 rounds of audit fixes
  (accessibility, CSP/HSTS headers, error boundaries, FOUC, image optimisation).
- Light mode removed — dark-only design (2026-07-10).
- Contact form wired to Elastic Email via a server-side API route, with field validation.
- **Magic Box** 3D builder (2026-07-13) and **Luggage Decal Splatter** (2026-07-17) Three.js
  pages. The decal orientation fix is in [`PITFALLS.md`](./PITFALLS.md).
- Notion as the blog CMS with local-JSON fallback (2026-07-18); syntax highlighting, TOC,
  search, dynamic OG images.
