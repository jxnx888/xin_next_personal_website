# Xin Ning Personal Website - Next.js Version

This is a modern personal website built with Next.js 15, TypeScript, and Tailwind CSS. Migrated from Vue.js.

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Library**: Ant Design
- **State Management**: Zustand
- **Internationalization**: next-intl (English & Chinese)
- **Maps**: Mapbox GL
- **Video Player**: Video.js
- **Animations**: Fireworks.js, custom animations

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── [locale]/          # Internationalized routes
│   │   ├── layout.tsx     # Locale-specific layout
│   │   └── page.tsx       # Home page
│   └── globals.css        # Global styles
├── components/            # React components
├── lib/                   # Utility functions
├── messages/              # i18n translations
│   ├── en.json           # English translations
│   └── zh.json           # Chinese translations
├── public/               # Static assets
├── store/                # Zustand stores
└── i18n.ts              # i18n configuration
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Features

- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Internationalization (EN/CN)
- ✅ Dark mode support
- ✅ Blog system
- ✅ Project showcase
- ✅ Skills visualization
- ✅ Contact form with map
- ✅ Animations and effects

## Migration Notes

This project was migrated from Vue.js 2 to Next.js 15. Three.js 3D components were intentionally excluded from this migration.
