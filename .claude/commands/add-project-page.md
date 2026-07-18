# Add Interactive Project Page

Checklist for adding a new Three.js / interactive project page to this portfolio.

## Files to create

```
app/[locale]/projects/<slug>/page.tsx
app/[locale]/projects/<slug>/<Name>Loader.tsx
app/[locale]/projects/<slug>/<Name>Client.tsx
```

**page.tsx** — Server component shell:
```tsx
import { Suspense } from 'react';
import <Name>Loader from './<Name>Loader';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <Name>Loader />
    </Suspense>
  );
}
```

**<Name>Loader.tsx** — Dynamic import with ssr:false:
```tsx
'use client';
import dynamic from 'next/dynamic';
const <Name>Client = dynamic(() => import('./<Name>Client'), { ssr: false });
export default function <Name>Loader() { return <<Name>Client />; }
```

**<Name>Client.tsx** — All Three.js logic, `'use client'`, `useEffect(setup, [])`.

## Files to update

- [ ] `public/mock/projects.json` — add project entry with `routeLink: "/projects/<slug>"`
- [ ] `public/mock/projectsCN.json` — add Chinese version
- [ ] `messages/en.json` — add namespace `"<camelSlug>": { ... }` for UI strings
- [ ] `messages/zh.json` — add same keys in Chinese
- [ ] `lib/types/projects.ts` — only if new fields needed on `Project` interface

## Checklist

- [ ] Loader uses `dynamic(..., { ssr: false })`
- [ ] Client component cleans up in `useEffect` return (animId, listeners, renderer, controls)
- [ ] Three.js vectors pre-allocated outside loops
- [ ] Full-screen layout: `position: fixed; inset: 0; z-index: 100` to cover nav
- [ ] Loading state via React state, not Three.js
- [ ] i18n strings added to both en.json and zh.json
- [ ] Both mock JSON files updated (EN + CN)
- [ ] ProjectCard "Try It →" button links to the new route
