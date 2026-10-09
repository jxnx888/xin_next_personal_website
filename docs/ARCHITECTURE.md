# Architecture

How the site is put together, and the rules that keep it that way. For *how to add*
things (projects, pages, translations) see [`CONVENTIONS.md`](./CONVENTIONS.md); for
bugs that have already bitten see [`PITFALLS.md`](./PITFALLS.md).

---

## SSR pattern (strictly follow this)

Every page = **Server Component** (data) + **Client Component** (interactivity).

```
app/[locale]/foo/page.tsx          ← Server: fetch data, generate metadata, pass as props
app/[locale]/foo/FooClient.tsx     ← Client: state, events, Three.js
```

Server data is read via `lib/utils/serverData.ts` using `fs.readFileSync` from `public/mock/`.
Never fetch data client-side for content that can be server-rendered.

---

## Content data sources

| Content | Source | Getter (`serverData.ts`) |
|---|---|---|
| Blog | Notion **or** `public/mock/blogEN.json` / `blogCN.json` | see below |
| Projects / careers | `public/mock/projects.json` / `projectsCN.json` | `getServerProjectsData` |
| Roblox games | `public/mock/robloxGames.json` / `robloxGamesCN.json` | `getServerRobloxGames` |

Projects and games have no CMS — edit the JSON and keep both locales in sync.

### Blog — two branches

`lib/utils/serverData.ts` switches source at request time based on env vars:

```
NOTION_TOKEN && NOTION_BLOG_DB_ID set?
  ├─ yes → lib/utils/notionBlog.ts  (Notion API → notion-to-md → marked → highlight.js)
  └─ no  → public/mock/blogEN.json / blogCN.json
```

Both branches return the same shapes (`lib/types/blog.ts`) — pages never know which
is active. When changing the blog shape, **update both paths**, not just one.

When testing blog changes, be explicit about which branch you are on — a change that
works against the local JSON may not work against Notion, and vice versa.

#### Notion database properties

What `notionBlog.ts` actually reads. A post's id is its Notion page id.

| Property | Type | Used for |
|---|---|---|
| (title) | Title | Fallback title when `TitleZH` is empty |
| `TitleZH` / `TitleEN` | Text | Per-locale title; `TitleEN` falls back to `TitleZH` |
| `Status` | Status | Only `Published` is shown |
| `Publish Date` | Date | Sort order; posts dated in the future stay hidden |
| `Language` | Select | `English` / `Chinese` / `Both` — which locale lists the post |
| `Tags` | Multi-select | Tag filter and `BlogPost.type` |

There is no abstract property: `abstract` is derived from the first ~160 characters of the
rendered body (see "Pick the cheapest shape" below).

#### Pick the cheapest shape

`abstract` and `readTime` are derived from the article body, so wanting either one costs
a content fetch per post. Three shapes, three `serverData.ts` entry points:

| Shape | Getter | Cost | Callers |
|---|---|---|---|
| `BlogIndexItem` | `getServerBlogIndex` | one `databases.query` | `sitemap.ts`, related posts |
| `BlogSummary` | `getServerBlogSummaries` | one content fetch per post | blog list, `BlogCard` |
| `BlogPost` | `getServerBlogBySlug` | one content fetch | blog detail |

**Always reach for the cheapest one that covers what you actually render.** Using a
heavier shape than needed is not a micro-optimisation here: the sitemap rebuilds daily
and used to pull all 60 articles' bodies to read ids and dates, and the blog list used to
ship every body to the browser — 668 KB of HTML for a page that renders excerpts.

#### Caching (`lib/utils/notionBlog.ts`)

Published posts are append-only: old articles don't change, only new ones appear. So
bodies are cached **indefinitely** per post (tagged `blog-post-<id>`) and the index sits
behind `blog-index`.

- Use Next's **Data Cache**, never a module-level `Map`. The build renders each page in a
  separate worker process and Vercel serves from separate instances — in-memory state is
  not shared between the blog list and a post opened from a search result.
- Bodies never expire on their own, so **`/api/revalidate` must purge the tags**, not just
  the paths. Purging a path alone re-renders the page from the same cached body.
- Requests are paced to ~3/s with 429 retry, matching Notion's limit. `notion-to-md`
  issues one request per nested block, so an unpaced list build fires hundreds at once.
  That pacing is why `staticPageGenerationTimeout` is raised in `next.config.ts`.

`lib/utils/notionBlog.ts` also configures `marked` with a custom renderer that injects
`id` attributes on headings (for the TOC) and wraps code blocks in
`.code-block-wrap` with highlight.js classes. `blogUtils.ts` holds the shared pure
helpers — `getTagCounts` and `filterBlogsByTag` are generic over the post shape because
they only read `type`.

### Roblox games

`/projects/roblox` (`app/[locale]/projects/roblox/`) is a plain Server + Client page, not
a Three.js app. Its JSON (`lib/types/games.ts` → `RobloxGamesData`) holds two things:

- `games[]` — rendered on the games page, **newest release first**
- `intro` + `learnings` — the "currently learning Roblox" block, rendered at the top of
  the **projects** page, not the games page. `projects/page.tsx` reads both JSON files.

Screenshots live in `public/image/games/` as compressed `.webp` (≤ ~200 KB each).

---

## Navigation

- Top nav items: `lib/constants/menuData.ts`, labels are keys in `messages/*.json`.
  `Navigation.tsx` highlights only the **longest** matching route, so a nested item
  (`/projects/roblox` → Games) doesn't also light up its parent (Projects).
- Projects-page side menu: `components/projects/ScrollMenu.tsx`. Items come from
  `projects/page.tsx` (`Roblox` first, then one per career); each key maps to an element
  `id` with spaces stripped.

---

## API routes

| Route | Purpose |
|---|---|
| `app/api/contact/route.ts` | `POST` — contact form → Elastic Email HTTP API. Needs `ELASTIC_EMAIL_API_KEY`. |
| `app/api/revalidate/route.ts` | `GET`/`POST` — on-demand ISR purge, guarded by `?secret=<REVALIDATE_SECRET>`. See the file's header comment for usage. |

---

## i18n

Two concerns — keep them separate:

| | Where |
|---|---|
| UI strings (buttons, labels, nav, hints) | `messages/en.json` + `messages/zh.json` |
| Content data (projects, games, blog posts, career) | `public/mock/*.json` (EN) + `public/mock/*CN.json` (ZH) |

Access UI strings with `useTranslations('namespace')` or `getTranslations('namespace')` (server).
Never put project descriptions or blog content into `messages/`.

Locale routing (`/en`, `/zh`) is `proxy.ts` — the Next 16 name for `middleware.ts`.

---

## Three.js interactive pages

Pages that are full Three.js apps (Magic Box, Decal Splatter) use a Loader pattern:

```
page.tsx           ← Server shell + Suspense
FooLoader.tsx      ← dynamic import with ssr:false
FooClient.tsx      ← entire Three.js logic ('use client', useEffect)
```

The client component mounts the Three.js renderer into a `containerRef` div and cleans up
in the useEffect return. All Three.js state lives in closure variables inside the effect,
not in React state.

---

## File map

```
app/
  layout.tsx                   Root layout (html shell)
  global-error.tsx             Root error boundary
  not-found.tsx                404 page
  sitemap.ts                   All routes + every blog post, per locale
  robots.ts                    Points at the sitemap
  manifest.ts                  PWA manifest (icon-192 / icon-512)
  globals.css                  CSS custom properties + .btn-glow-* classes

  api/contact/route.ts         POST — contact form → Elastic Email
  api/revalidate/route.ts      GET/POST — on-demand ISR, ?secret= guarded

  [locale]/
    layout.tsx                 Locale layout — metadata, providers, <html lang>
    error.tsx                  Locale-level error boundary
    page.tsx / HomeClient      Home
    projects/page.tsx          Projects (Server) — careers + Roblox learning block
    projects/ProjectsPageClient  Projects (Client)
    projects/roblox/           Roblox games page (Server + RobloxGamesClient)
    projects/magic-box/        Magic Box Three.js app
    projects/decal_splatter/   Decal Splatter Three.js app
    blog/page.tsx              Blog list (Server)
    blog/[id]/page.tsx         Blog detail (Server) — JSON-LD + BreadcrumbList
    blog/[id]/opengraph-image.tsx   Dynamic per-post OG image
    contact/page.tsx           Contact form
    resume/page.tsx            PDF viewer

components/
  ThemeProvider.tsx            Stub — hard-coded dark, no toggle UI
  AntdProvider.tsx             Ant Design locale + registry
  layout/Navigation.tsx        Nav (uses lib/constants/menuData.ts)
  layout/Footer.tsx            Social links (icons use aria-label, alt="")
  layout/PageBanner.tsx
  home/HeroWave.tsx            Three.js wave (desktop only)
  home/AnimatedName.tsx
  blog/                        BlogCard, BlogCoverImage, BlogSidebar, TagBadge
  projects/                    ProjectCard, ScrollMenu
  resume/MobilePdfViewer.tsx
  ui/                          GlowButton, SectionCard, GridBackground, SectionHeader

lib/
  utils/serverData.ts          fs.readFileSync helpers + Notion/JSON branch
  utils/notionBlog.ts          Notion API → notion-to-md → marked → highlight.js
  utils/blogUtils.ts           Client-side blog cache (Promise cache) + AbortSignal
  constants/menuData.ts        Nav items
  hooks/useTypewriter.ts
  types/projects.ts            Project, Career, ProjectsData, ProjectsResponse
  types/blog.ts                BlogPost, TagCount, TocHeading
  types/games.ts               RobloxGame, RobloxGamesData
  threejs/TransformControls.js Vendored Three.js control

i18n/config.ts + request.ts   next-intl locales + request config
proxy.ts                      Locale routing (/en, /zh) — renamed from middleware.ts in Next 16
eslint.config.mjs             ESLint flat config (`next lint` was removed in Next 16)
messages/en.json + zh.json    UI strings — keys must stay 1:1
public/mock/*.json            Content data — projects(.CN), robloxGames(.CN), blogEN/blogCN
public/models/stl/ascii/      STL models for Three.js pages
public/image/decals/          54 built-in decal stickers
public/image/games/           Roblox game covers, icons and screenshots (.webp)
docs/                         This documentation
```

There is no Zustand store in use — `store/` was removed. Add one back only if a real
cross-page client state need appears.
