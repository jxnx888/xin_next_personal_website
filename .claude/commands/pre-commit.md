# Pre-Commit Check

Run this before every commit to catch lint and type errors early.

Next 16 removed `next lint`, and `next build` no longer runs ESLint. A lint error
will **not** fail the build, so this check has to be run explicitly.

## Steps

1. Run ESLint (flat config, `eslint.config.mjs`):
```bash
npm run lint
```

2. Run the type check — `next build` still fails on type errors, but catching them
   here is faster than a full build:
```bash
npx tsc --noEmit
```

3. Interpret results:
   - **Error** — must fix before committing. Do not proceed.
   - **Warning** — review, fix if trivial. Two categories are expected and accepted:
     - `<img>` warnings inside Three.js client files (`MagicBoxClient.tsx`,
       `DecalSplatterClient.tsx`, `*Loader.tsx`) — `next/image` cannot be used for
       dynamically-loaded Three.js textures or canvas-context images. Suppress with
       `{/* eslint-disable-next-line @next/next/no-img-element */}` if needed.
     - `react-hooks/*` warnings (set-state-in-effect, immutability, purity, refs) —
       the React Compiler rule family added in eslint-config-next 16. These are
       downgraded to warnings in `eslint.config.mjs`; see the comment there.

4. Fix all Errors, then re-run to confirm clean.

5. Only then proceed with `git add` + `git commit`.

## Scope note

`next lint` only scanned `app/`, `components/`, `lib/`, `pages/` and `src/`.
`eslint .` scans the whole repo, so `eslint.config.mjs` ignores `.next/`,
`public/` (static assets, incl. the minified pdf.worker bundle) and
`lib/threejs/` (vendored Three.js control).

## Common errors in this project

| Error | Fix |
|---|---|
| `prefer-const` | Change `let` to `const` if variable is never reassigned (object mutation is fine) |
| `no-unused-vars` | Remove unused import or variable |
| `react-hooks/exhaustive-deps` | Add missing dep to `useEffect` array, or suppress with comment if intentional (Three.js effects with `[]` are intentional) |
| `@next/next/no-img-element` | Replace with `<Image>` from `next/image` — EXCEPT inside Three.js client files |
| Unused `eslint-disable` directive | Remove the stale directive — the rule no longer fires there |
