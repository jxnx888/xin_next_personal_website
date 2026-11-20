# Roadmap

Last reviewed: 2026-10-08.

The **Deferred** list is the valuable half: each item was investigated, has a known fix,
and was left alone for a stated reason. Read it before "cleaning up" a deprecation warning
or a lint warning — the obvious fix can quietly break SSG or the Three.js pages.

When an item is done, move it to **Done** with the date and add a
[`CHANGELOG.md`](./CHANGELOG.md) entry.

---

## Open

- [ ] **Spinning Survivors uses a `share?code=…` link.** Only the share link was found; the
  `roblox.com/games/<placeId>/…` URL is more stable. Swap it in `robloxGames.json` +
  `robloxGamesCN.json` once the place id is known.

## Deferred — each has a real tradeoff, do not "just fix" without deciding

- [ ] **Blog list cards are not in the server-rendered HTML.** `BlogPageClient` calls
  `useSearchParams()`, so the Suspense boundary defers to the client and crawlers see an
  empty list. Predates the Next 16 upgrade. Fix = read `searchParams` on the server and
  pass as props, **which turns the route from SSG to dynamic**. SEO vs. static rendering.

- [ ] **`setRequestLocale` / `requestLocale` are `@deprecated`** (next-intl points at
  `next/root-params`). Cannot use root-params: Next reports `No root params detected`
  because `app/layout.tsx` is the root layout and `[locale]` is nested under it. Clearing
  it means promoting `app/[locale]/layout.tsx` to root layout, which changes how
  `app/not-found.tsx` and `app/global-error.tsx` resolve — both currently render their own
  `<html>` precisely because the root layout is a passthrough. Works fine today; revisit
  if next-intl 5 removes it.

- [ ] **Blog list still fetches every article body** to derive `abstract` + `readTime`.
  This is the only remaining cause of slow cold builds. Fix needs an `Excerpt` property in
  Notion (changes the writing workflow) or dropping excerpts from the list.

- [ ] **`react-hooks/set-state-in-effect` downgraded to a warning** in
  `eslint.config.mjs`. The `setMounted(true)` hydration guards (HomeClient, Navigation) and
  ScrollMenu's viewport read could move to `useSyncExternalStore`. (immutability / purity /
  refs were restored to their defaults on 2026-11-20 once Magic Box moved to its engine.)

- [ ] **Magic Box on touch: the shape panel can't be scrolled by dragging an item**,
  because a touch on an item starts the drag-to-place. Scrolling works from the gaps and
  headers. A long-press-to-drag would fix it at the cost of a slower pick.

## Done

- [x] Magic Box overhaul — system-font text, engine + command undo + tests, i18n, CSS
  Module, a11y, shadows, shortcuts, real bounds (2026-11-20, see CHANGELOG)

- [x] Roblox games page, nav entry, projects-page learning block (2026-10-08)
- [x] Next 16 + next-intl 4 + ESLint CLI, blog fetch/caching overhaul (2026-09-22, PR #12)
- [x] SEO pass — sitemap gap, JSON-LD, OG, PWA icons (2026-08-07, see [`SEO_AUDIT.md`](./SEO_AUDIT.md))
- [x] Code-block syntax highlighting — `highlight.js` + `marked` renderer (2026-07-18)
- [x] Sitemap + robots.txt (2026-07-18)
- [x] Blog TOC — `extractHeadings` in `blogUtils.ts`, sticky sidebar
- [x] Dynamic OG images — `app/[locale]/blog/[id]/opengraph-image.tsx`
- [x] Blog search — `fuse.js` in `BlogPageClient` (searches title/abstract/type, **not** body)
