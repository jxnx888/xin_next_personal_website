# CLAUDE.md — Xin Ning Personal Website

Personal portfolio site. Next.js 15, TypeScript, Three.js, next-intl (en/zh), dark-only design.

---

## Collaboration Preferences

- **Always reply to the user in Chinese (中文).** Never slip in English or Japanese filler words/phrases in the reply text. Code identifiers, file paths, and proper nouns (`Notion`, `ESLint`, etc.) can stay as-is, but surrounding explanations must be Chinese.
- **Never run `git commit` unless the user explicitly asks for it** (e.g. "commit", "帮我commit", "提交一下"). The user wants to review all changes themselves before they are committed — stop at the file edits and wait.

---

## Git Workflow

- Active branch: `develop`. Features go here, PR into `master`.
- Commit style: `feat(scope):`, `fix(scope):`, `chore:` — concise, imperative.
- Always push `develop` before creating a PR.
- **Before every commit: run `/pre-commit` (ESLint check).** Fix all Errors before committing. Warnings in Three.js client files (`*Client.tsx`, `*Loader.tsx`) for `<img>` are acceptable — suppress with `eslint-disable-next-line` if needed.

---

## Architecture

### SSR Pattern (strictly follow this)

Every page = **Server Component** (data) + **Client Component** (interactivity).

```
app/[locale]/foo/page.tsx          ← Server: fetch data, generate metadata, pass as props
app/[locale]/foo/FooClient.tsx     ← Client: state, events, Three.js
```

Server data is read via `lib/utils/serverData.ts` using `fs.readFileSync` from `public/mock/`.  
Never fetch data client-side for content that can be server-rendered.

### i18n

Two concerns — keep them separate:

| | Where |
|---|---|
| UI strings (buttons, labels, nav, hints) | `messages/en.json` + `messages/zh.json` |
| Content data (projects, blog posts, career) | `public/mock/*.json` (EN) + `public/mock/*CN.json` (ZH) |

Access UI strings with `useTranslations('namespace')` or `getTranslations('namespace')` (server).  
Never put project descriptions or blog content into `messages/`.

### Three.js Interactive Pages

Pages that are full Three.js apps (Magic Box, Decal Splatter) use a Loader pattern:

```
page.tsx           ← Server shell + Suspense
FooLoader.tsx      ← dynamic import with ssr:false
FooClient.tsx      ← entire Three.js logic ('use client', useEffect)
```

The client component mounts the Three.js renderer into a `containerRef` div and cleans up in the useEffect return. All Three.js state lives in closure variables inside the effect, not in React state.

---

## Key Conventions

### Adding a new project entry

Update ALL of these — they must stay in sync:

1. `public/mock/projects.json` — English content
2. `public/mock/projectsCN.json` — Chinese content
3. `lib/types/projects.ts` — only if the `Project` interface needs a new field

ProjectCard shows: **Try It →** (`routeLink`), **Visit Site** (`url`). No View Code button.

### Adding a new interactive project page

1. Create `app/[locale]/projects/<slug>/page.tsx` + `<Name>Client.tsx` + `<Name>Loader.tsx`
2. Add `routeLink: "/projects/<slug>"` to `projects.json` + `projectsCN.json`
3. Add i18n strings under a new namespace in `messages/en.json` + `messages/zh.json`
4. Run `/add-project-page` for a checklist

### Updating translations

Always update BOTH `messages/en.json` AND `messages/zh.json` together. Never leave one missing a key the other has.

---

## Design System

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

Button classes (defined in `globals.css`): `.btn-glow-primary`, `.btn-glow-outline`, `.btn-glow-purple`.  
Use `GlowButton` component for external links.

---

## Known Pitfalls (from past bugs)

### Three.js Decal orientation on non-front faces
`_tempObj.lookAt()` extracts Euler Z ≠ 0 for back/side faces (e.g., `π` for back face).  
**Never do** `orientation.z = userRot` — it overwrites the base Euler-Z and flips the sticker.  
**Always do** `orientation.z += userRot` (add, not replace). Store `baseZ` separately in `decalsPR`.

### Three.js HeroWave theme toggle
HeroWave uses two separate effects: `[]` for setup (creates WebGL renderer once), `[theme]` for color updates (uses refs). Never merge into one effect — it tears down the WebGL context on theme toggle.

### `.next/trace` EPERM on Windows
Kill all Node processes → delete `.next/` → restart dev server.

### Mock data has no trailing `code` field anymore
`projects.json` / `projectsCN.json` no longer have a `code` field per project. Don't add it back. The `Project` type in `lib/types/projects.ts` does not include it.

---

## File Map (quick reference)

```
app/[locale]/
  page.tsx                     Home
  projects/page.tsx            Projects (Server)
  projects/ProjectsPageClient  Projects (Client)
  projects/magic-box/          Magic Box Three.js app
  projects/decal_splatter/     Decal Splatter Three.js app
  blog/page.tsx                Blog list (Server)
  blog/[id]/page.tsx           Blog detail (Server)
  contact/page.tsx             Contact form
  resume/page.tsx              PDF viewer

components/layout/Navigation.tsx   Nav (uses lib/constants/menuData.ts)
components/projects/ProjectCard.tsx
components/projects/ScrollMenu.tsx
components/home/HeroWave.tsx        Three.js wave (desktop only)
components/ui/                      GlowButton, SectionCard, GridBackground, SectionHeader

lib/utils/serverData.ts       fs.readFileSync data helpers
lib/utils/blogUtils.ts        Blog cache + AbortSignal
lib/constants/menuData.ts     Nav items
lib/types/projects.ts         Project, Career, ProjectsData, ProjectsResponse
messages/en.json + zh.json    UI strings
public/mock/*.json            Content data (simulated CMS)
public/models/stl/ascii/      STL models for Three.js pages
public/image/decals/          54 built-in decal stickers
store/useGlobalStore.ts       Zustand global store
```
