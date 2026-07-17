# Xin Ning — Personal Website

Personal portfolio site built with Next.js 15, TypeScript, and Three.js. Bilingual (EN / ZH), dark-only design.

## Tech Stack

| | |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS + CSS custom properties |
| i18n | next-intl (en / zh) |
| 3D | Three.js 0.185 |
| UI | Ant Design 5 |
| State | Zustand 5 |
| Analytics | Vercel Analytics |

## Pages

| Route | Description |
|---|---|
| `/` | Home — hero, skills, featured projects |
| `/projects` | Portfolio — career timeline + project cards |
| `/projects/magic-box` | Magic Box — interactive 3D builder |
| `/projects/decal_splatter` | Luggage Decal Splatter — Three.js decal customizer |
| `/blog` | Blog list with tag filtering |
| `/blog/[id]` | Blog post detail |
| `/resume` | PDF resume viewer |
| `/contact` | Contact form |

## Getting Started

```bash
npm install
npm run dev
# → http://localhost:3000
```

## Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm run start    # Production server
npm run lint     # ESLint
```

## Project Structure

```
app/[locale]/          # All routes (SSR server components + client wrappers)
components/            # Layout, UI, page-specific components
lib/                   # Types, utils, hooks, constants
messages/              # i18n strings — en.json / zh.json (UI strings only)
public/mock/           # Content data — projects, blog posts (simulated CMS)
public/models/         # Three.js STL models
public/image/          # Static images and decal stickers
store/                 # Zustand global store
```
