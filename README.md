# Xin Ning — Personal Website

Personal portfolio site built with Next.js 15, TypeScript, and Three.js. Bilingual (EN / ZH), dark-only design.

Live at **[www.ning-xin.com](https://www.ning-xin.com)**.

## Tech Stack

| | |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS + CSS custom properties |
| i18n | next-intl (en / zh) |
| 3D | Three.js 0.185 |
| UI | Ant Design 5 |
| Blog CMS | Notion API (optional) — falls back to local JSON |
| Email | Elastic Email HTTP API |
| Analytics | Vercel Analytics + Speed Insights |

## Pages

| Route | Description |
|---|---|
| `/` | Home — hero, skills, featured projects |
| `/projects` | Portfolio — career timeline + project cards |
| `/projects/magic-box` | Magic Box — interactive 3D builder |
| `/projects/decal_splatter` | Luggage Decal Splatter — Three.js decal customizer |
| `/blog` | Blog list with tag filtering + search |
| `/blog/[id]` | Blog post detail |
| `/resume` | PDF resume viewer |
| `/contact` | Contact form |

Every route is served under a locale prefix — `/en/...` and `/zh/...` — via `middleware.ts`.

## Getting Started

```bash
npm install
cp .env.example .env.local   # then fill in the values — see below
npm run dev
# → http://localhost:3000
```

The site runs without any environment variables, but the contact form will return a
500 and the blog will read from local JSON instead of Notion.

## Environment Variables

All variables are documented in `.env.example`. Copy it to `.env.local` (git-ignored)
and fill in what you need.

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Recommended | `metadataBase` for OG / Twitter cards, canonical URLs, sitemap. Falls back to `https://www.ning-xin.com`. |
| `ELASTIC_EMAIL_API_KEY` | For `/contact` | Server-side key for the Elastic Email HTTP API. Without it, `POST /api/contact` returns 500. |
| `NOTION_TOKEN` | Optional | Notion internal integration secret. Enables the Notion blog source. |
| `NOTION_BLOG_DB_ID` | Optional | Notion database ID holding the posts. Must be set together with `NOTION_TOKEN`. |
| `REVALIDATE_SECRET` | Optional | Shared secret guarding `/api/revalidate`. |

## Content & Data Sources

Two separate concerns — do not mix them:

| | Where |
|---|---|
| UI strings (buttons, labels, nav, hints) | `messages/en.json` + `messages/zh.json` |
| Content data (projects, blog posts, career) | `public/mock/*.json` (EN) + `public/mock/*CN.json` (ZH) |

### Blog: Notion or local JSON

`lib/utils/serverData.ts` picks the source at request time:

```
NOTION_TOKEN && NOTION_BLOG_DB_ID set?
  ├─ yes → lib/utils/notionBlog.ts   (Notion API → notion-to-md → marked → highlight.js)
  └─ no  → public/mock/blogEN.json / blogCN.json
```

Both paths return the same `BlogPost[]` shape (`lib/types/blog.ts`), so the pages are
unaware of which one is active. To develop offline, just leave the Notion vars unset.

### Projects

Always read from `public/mock/projects.json` (EN) and `projectsCN.json` (ZH) via
`getServerProjectsData()`. There is no CMS for projects — edit the JSON and keep both
locales in sync.

## API Routes

| Route | Method | Description |
|---|---|---|
| `/api/contact` | `POST` | Sends the contact-form submission through Elastic Email. Requires `ELASTIC_EMAIL_API_KEY`. |
| `/api/revalidate` | `GET` / `POST` | On-demand ISR purge. Requires `?secret=<REVALIDATE_SECRET>`. |

Revalidation examples:

```bash
# Purge the blog list in both locales
curl "https://www.ning-xin.com/api/revalidate?secret=$REVALIDATE_SECRET"

# Purge one post + the list
curl "https://www.ning-xin.com/api/revalidate?secret=$REVALIDATE_SECRET&slug=<notion-page-id>"

# Purge everything
curl "https://www.ning-xin.com/api/revalidate?secret=$REVALIDATE_SECRET&type=all"
```

`POST` is supported for webhook integrations (e.g. a Notion automation firing after publish).

## SEO & Metadata

Generated at build time from the App Router conventions:

- `app/sitemap.ts` — all static routes + every blog post, per locale
- `app/robots.ts` — points at the sitemap
- `app/manifest.ts` — PWA manifest with `icon-192` / `icon-512`
- `app/[locale]/blog/[id]/opengraph-image.tsx` — dynamic per-post OG image
- Canonical + `hreflang` on every page; JSON-LD (`BlogPosting`, `BreadcrumbList`) on post pages

See `SEO_AUDIT.md` for the audit trail and the remaining manual tasks.

## Scripts

```bash
npm run dev      # Development server
npm run build    # Production build (standalone output)
npm run start    # Production server
npm run lint     # ESLint — must be clean before committing
```

## Deployment

Deployed on Vercel. `next.config.ts` sets:

- `output: 'standalone'` — self-contained server bundle, also usable in Docker
- Security headers on every route — CSP, HSTS, `X-Frame-Options: DENY`,
  `X-Content-Type-Options`, `Referrer-Policy`
- `eslint.ignoreDuringBuilds: false` and `typescript.ignoreBuildErrors: false` —
  a lint error or type error **fails the build**

The CSP `img-src` allowlist includes the cnblogs and Notion S3 image hosts. If you add
a new remote image source, update both the CSP in `next.config.ts` and
`images.remotePatterns`.

## Project Structure

```
app/
  [locale]/            All routes (SSR server components + client wrappers)
  api/                 contact (Elastic Email) + revalidate (on-demand ISR)
  sitemap.ts           robots.ts, manifest.ts, global-error.tsx, not-found.tsx
components/            Layout, UI, blog, projects, home, resume components
i18n/                  next-intl config + request handler
lib/
  types/               BlogPost, Project, Career
  utils/               serverData (fs), notionBlog (Notion), blogUtils (client cache)
  hooks/               useTypewriter
  constants/           menuData (nav items)
  threejs/             Vendored TransformControls
messages/              i18n strings — en.json / zh.json (UI strings only)
public/mock/           Content data — projects, blog posts (simulated CMS)
public/models/         Three.js STL models
public/image/          Static images and decal stickers
```

## Contributing / Conventions

Project-specific conventions, architecture rules, and known pitfalls live in
[`CLAUDE.md`](./CLAUDE.md). Read it before adding a page or a project entry.
