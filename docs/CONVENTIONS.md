# Conventions

How to add or change things without breaking the rules in
[`ARCHITECTURE.md`](./ARCHITECTURE.md).

---

## Adding a new project entry

Update ALL of these — they must stay in sync:

1. `public/mock/projects.json` — English content
2. `public/mock/projectsCN.json` — Chinese content
3. `lib/types/projects.ts` — only if the `Project` interface needs a new field

ProjectCard shows: **Try It →** (`routeLink`), **Visit Site** (`url`). No View Code button.

## Adding a new interactive project page

1. Create `app/[locale]/projects/<slug>/page.tsx` + `<Name>Client.tsx` + `<Name>Loader.tsx`
2. Add `routeLink: "/projects/<slug>"` to `projects.json` + `projectsCN.json`
3. Add i18n strings under a new namespace in `messages/en.json` + `messages/zh.json`
4. Run `/add-project-page` for a checklist

## Adding a Roblox game

1. Add the game to `games[]` in **both** `public/mock/robloxGames.json` and
   `robloxGamesCN.json`. Keep the array **newest release first** — the page renders it in
   file order.
2. Put images in `public/image/games/<slug>-*.webp`: one cover (16:9), one square icon
   (256 px), three screenshots. Compress before committing — source PNGs from Roblox
   docs are 2–3 MB each; resize to 1280 px wide and encode WebP (quality ~78).
3. Keep `features` to ~6 one-line items. The highlights card sits in a narrow column next
   to the description; long items wrap into a column much taller than the text beside it.
4. Prefer the `roblox.com/games/<placeId>/<Name>` URL for `playUrl`; a `share?code=…`
   link works but is less stable.

## Adding a top-nav item

Add it to `lib/constants/menuData.ts` (renumber `id`s) and add the label key to **both**
`messages/en.json` and `messages/zh.json`. Nested routes are fine — the active
highlight picks the longest match.

## Updating translations

Always update BOTH `messages/en.json` AND `messages/zh.json` together. Never leave one
missing a key the other has. When removing a component's last use of a key, remove the
key from both files too.

Edit the JSON as text (insert/remove lines). Re-serialising it with `JSON.stringify`
expands the inline arrays (`"KEEP_LEARNING": [...]`, `contact.*`) and produces a large,
noisy diff.

---

## Design system

Dark mode only. All colors via CSS custom properties — never hardcode hex values.

| Token | Use |
|---|---|
| `--bg` | Page background |
| `--bg-secondary` | Card/panel background |
| `--accent` | Cyan highlight (`#00d4ff`) |
| `--text` | Primary text |
| `--text-muted` | Secondary text |
| `--text-dim` | Tertiary / labels |
| `--border` | Card borders |
| `--border-input` | Input borders |

The full token list is at the top of `app/globals.css` (`--accent-dim`, `--accent-glow`,
`--glass-bg`, `--image-overlay`, …).

Button classes (defined in `globals.css`): `.btn-glow-primary`, `.btn-glow-outline`, `.btn-glow-purple`.
Use `GlowButton` component for external links.

No emoji in page copy — the site's visual language is the cyan accent and `›` bullets.

---

## Keeping these docs current

Every change that adds a route, a data file, a convention or a pitfall updates the doc
that owns it, and adds an entry to [`CHANGELOG.md`](./CHANGELOG.md) in the same commit.
A deferred decision goes into [`ROADMAP.md`](./ROADMAP.md) with the reason it was deferred.
