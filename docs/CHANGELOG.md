# Changelog

What changed and **why**, newest first. The *what* is also in `git log`; this file is for
the reasoning that a commit subject can't hold. Add an entry in the same commit as the
change.

---

## 2026-10-29 — Contact form drops bot submissions

Bot submissions started arriving: random-letter name, subject and message, a dotted Gmail
address (Gmail ignores dots, so spammers vary them to dodge blocklists). The form had no
protection, so a zero-config check went in first. Turnstile was deferred: it needs keys
and a server-side verify call, and this may be enough.

- **Fill time** — the client sends `elapsedMs` since mount; under 3s is a bot. A missing
  value also counts, which catches scripts that POST to `/api/contact` directly — the
  likely source here, since these submissions pass the client-side validation anyway.
- **Origin** — the `Origin` header must match the request's own host (`x-forwarded-host`
  or `host`). Browsers always send it on a POST; many scripts don't. Matching the host
  instead of hardcoding `ning-xin.com` keeps localhost, `www` and preview deploys working.
  Trivially forged, but free.

Both checks are spoofable by a bot that bothers. If spam keeps coming, the next step is
Turnstile, not more homemade checks.

**No honeypot — tried and removed.** An off-screen hidden input dropped real manual
submissions twice: first named `website`, then renamed to `hp_extra` with no label and
the `data-lpignore`/`data-1p-ignore`/`data-bwignore` attributes. Both times the browser's
autocomplete put the email (`test@test.com`) into it — autofill does not go by field name
alone, and real visitors use autofill too. A check that silently discards real messages
costs more than the bots it stops, so don't re-add one without testing against real
browser autofill.

Dropped submissions still get a 200 `{ success: true }` so the bot has nothing to tune
against; they are only logged with `console.warn`.

Also fixed while in there: fields were interpolated raw into the email HTML, so anyone
could inject markup or links into mail that arrives from our own domain. They are now
HTML-escaped (the plain-text subject line and `replyTo` keep the raw values).

---

## 2026-10-11 — Hero and bio mention game development; job title does not

With the games now surfaced on the home page, the copy above them still described only
web work. Two of the three obvious places were widened; the third deliberately was not.

`MY_TITLE` stays "Full-Stack Developer". That string feeds the hero, the bio card, the
resume page **and** `jobTitle` in the Person JSON-LD, so widening it to "Full-Stack
Developer & Game Developer" would have put an overclaim into structured data — the games
are a month old and the site itself labels them "currently learning", against eight years
and four companies of web work. It would also blur the positioning a recruiter reads in
the first two seconds.

Instead:

- a third `INTRODUCTION` line ("Currently Building Games on Roblox.") — visible in the
  hero, but phrased as current activity rather than identity. `useTypewriter` cycles
  `words[loopNum % words.length]`, so a third entry needed no code change.
- one sentence appended to `HOME_ABOUT`, which until now described only *how* he works
  (clean code, performance, teamwork) and never what he is working on. It also bridges
  into the Games section directly below it.

---

## 2026-10-11 — Discord invite on the games page

One compact row above the games list. Not next to either Play button — one server covers
both games, and per-game placement would have implied otherwise. Not below the list
either, which is where it started: the page is roughly 2600px of covers and screenshots
on desktop and five or six screens on mobile, so almost nobody reached it. A full-height
card at the top would have pushed the "My Games" heading off the first screen, hence the
single-row form.

It uses the `purple` variant, which existed in `globals.css` as `.btn-glow-purple` but was
missing from `GlowButton`'s prop type, so `ProjectCard` reaches for the raw class instead.
Added `'purple'` to the union. `ProjectCard` was left alone — switching it over is
unrelated to this change.

---

## 2026-10-11 — Games on the home page

The Roblox games shipped on 2026-10-08 were reachable from the top nav and the projects
page, but the home page — the page most visitors actually land on — said nothing about
them. The `robloxGames.ctaTitle` / `ctaButton` strings already existed and were only wired
into the projects page, so the home section reuses them rather than adding near-duplicate
copy.

Placed between Featured Work and Keep Learning: professional work first, then the side
project, then the closing quote — and the Roblox block reads as the setup for a section
about learning. The home card shows icon, tagline, genre and release for each game and
deep-links to `#<id>` on the games page; it deliberately does not repeat `learnings`,
which stays on the projects page.

`HomeClient` now takes a `robloxGames` prop — the first data it has ever received. Home
previously rendered entirely from i18n and hardcoded arrays.

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
