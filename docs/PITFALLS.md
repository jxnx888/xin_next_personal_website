# Known Pitfalls

Bugs that have already happened once. Each entry says what breaks and what to do instead.

---

## Three.js Decal orientation on non-front faces

`_tempObj.lookAt()` extracts Euler Z ≠ 0 for back/side faces (e.g., `π` for back face).
**Never do** `orientation.z = userRot` — it overwrites the base Euler-Z and flips the sticker.
**Always do** `orientation.z += userRot` (add, not replace). Store `baseZ` separately in `decalsPR`.

## Magic Box: async restore vs. autosave

STL models are restored from `localStorage` asynchronously. Saving writes whatever is in
the scene, so a save that ran before the STLs arrived (placing a shape right after the page
opened) used to erase them from storage for good. Items still loading live in
`MagicBoxEngine.pendingRestore` and are appended on every save — keep that if you touch
persistence.

Same family: STL picks are async. The load callback only applies if `this.armed` is still
the same object it was started for; anything else (a newer pick, text, Clear, unmount)
means it must do nothing — otherwise a late response arms or places the wrong model.

## Magic Box: a click after a drag is not a click

The browser fires `click` after an orbit drag that started and ended on the canvas. The
old code treated it as a real click, so releasing an orbit over empty ground deselected
the object — or placed the armed shape. `MagicBoxEngine.click` ignores it when the pointer
moved more than `CLICK_SLOP` px since `pointerDown`, and when the press began on the gizmo
(`tc.dragging`, already set because TransformControls sees pointerdown before React).

## Magic Box dialogs: no `autoFocus` on inputs

`Modal` records the element that had focus when it opened and gives focus back on close.
React applies `autoFocus` during commit — before the effect runs — so with `autoFocus` the
"previous" element was the dialog's own input, and closing dropped focus on `<body>`. The
effect focuses the first input itself instead.

## Magic Box CSS: reset rules must not out-rank classes

`.root button { font: inherit }` (specificity 0,1,1) silently beat `.sectionHeader`
(0,1,0) and blew every button's font-size up to the page default. Resets in
`MagicBox.module.css` go through `:where(.root)` so they have zero specificity.

## Three.js HeroWave theme toggle

HeroWave uses two separate effects: `[]` for setup (creates WebGL renderer once), `[theme]`
for color updates (uses refs). Never merge into one effect — it tears down the WebGL
context on theme toggle.

The site is dark-only today and `components/ThemeProvider.tsx` is a stub that provides a
hard-coded `{ theme: 'dark' }` with no toggle UI, so this bug cannot fire right now. Keep
the two-effect split anyway — merging it would silently re-introduce the bug the moment a
theme switch is added.

## ScrollMenu highlighted the previous item after a click

`ScrollMenu` scrolls to `section top − offset` on click, and marks a section active when
`scrollY ≥ section top − offset`. Landing exactly on that boundary, sub-pixel rounding left
it a fraction short and the **previous** item stayed highlighted. On mobile it was always
wrong, because the click offset (nav + bar height) was larger than the hard-coded 120 used
for detection.

It went unnoticed for months because the first item was also the default highlight. It
surfaced when the Roblox section was added above the careers.

**Rule:** click and detection share `getScrollOffset()`, and detection adds
`ACTIVE_TOLERANCE`. Don't reintroduce a separate offset in either place.

## `.next/trace` EPERM on Windows

Kill all Node processes → delete `.next/` → restart dev server.

## `next dev` rewrites `CLAUDE.md`

Next 16's `next dev` appends a `nextjs-agent-rules` block to `CLAUDE.md`
(`node_modules/next/dist/server/lib/generate-agent-files.js`). Deleting it from a diff only
brings it back on the next `next dev`. It is committed (2026-10-08) and kept at the end of
`CLAUDE.md` — leave it there when editing that file. To stop it instead, set
`agentRules: false` in `next.config.ts` and delete the block.

## Another `next dev` is already running

Next 16 refuses to start a second dev server for the same directory and prints the PID of
the existing one (usually on `:3000`). Use that server instead of killing it — it may be the
user's own session.

## Mock data has no trailing `code` field anymore

`projects.json` / `projectsCN.json` no longer have a `code` field per project. Don't add it
back. The `Project` type in `lib/types/projects.ts` does not include it.

There used to be a second, stale `lib/types/project.ts` (singular) whose `Project` still had
`code: number`, plus an unused `lib/utils/projectUtils.ts` that imported it. Both were
deleted. **The only project types file is `lib/types/projects.ts` (plural)** — if you see an
import from `types/project`, it is wrong.

## Repeated local builds drain the Notion quota

Notion's rate limit (~3 req/s average) is **per integration token**, and local development
and Vercel use the same token. Several full `npm run build` passes in a row against live
Notion exhaust the burst allowance, and then **Vercel's builds start failing too** — 429,
then 502 from Cloudflare — on a different machine, minutes to hours later.

This happened on 2026-09-22: about a dozen verification builds during the Next 16 upgrade
put the integration into sustained rate limiting, and the resulting Vercel preview failure
looked like a bug in the upgrade. It was not.

- For repeated verification, run `NOTION_TOKEN= NOTION_BLOG_DB_ID= npm run build` — the
  blog falls back to the local JSON and touches Notion zero times. Save one build against
  live Notion for the end.
- Bodies are cached indefinitely in `.next/cache`, so a rebuild that keeps it costs almost
  no Notion requests. `rm -rf .next` wipes it and goes back to a full cold fetch — delete
  only `.next/server` if the cache should survive.
- If Notion is already rate limited, waiting ~60 s is not enough; give it several minutes.
