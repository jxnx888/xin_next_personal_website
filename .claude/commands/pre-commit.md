# Pre-Commit Check

Run this before every commit to catch lint errors early.

## Steps

1. Run ESLint:
```bash
npx next lint
```

2. Interpret results:
   - **Error** — must fix before committing. Do not proceed.
   - **Warning** — review, fix if trivial. `<img>` warnings inside Three.js client files (`MagicBoxClient.tsx`, `DecalSplatterClient.tsx`, `*Loader.tsx`) are acceptable — `next/image` cannot be used for dynamically-loaded Three.js textures or canvas-context images; suppress with `{/* eslint-disable-next-line @next/next/no-img-element */}` if needed.

3. Fix all Errors, then re-run lint to confirm clean.

4. Only then proceed with `git add` + `git commit`.

## Common errors in this project

| Error | Fix |
|---|---|
| `prefer-const` | Change `let` to `const` if variable is never reassigned (object mutation is fine) |
| `no-unused-vars` | Remove unused import or variable |
| `react-hooks/exhaustive-deps` | Add missing dep to `useEffect` array, or suppress with comment if intentional (Three.js effects with `[]` are intentional) |
| `@next/next/no-img-element` | Replace with `<Image>` from `next/image` — EXCEPT inside Three.js client files |
