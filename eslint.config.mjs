import { defineConfig } from 'eslint/config';
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

export default defineConfig([
  {
    // `next lint` only ever scanned app/, components/, lib/, pages/ and src/.
    // `eslint .` scans everything, so exclude build output and vendored code.
    ignores: [
      '.next/**',
      'next-env.d.ts',
      'public/**', // static assets, incl. the minified pdf.worker bundle
      'lib/threejs/**', // vendored Three.js TransformControls
    ],
  },
  {
    extends: [...nextCoreWebVitals, ...nextTypescript],
  },
  {
    // eslint-config-next 16 adds the React Compiler rule family.
    // set-state-in-effect flags the `setMounted(true)` SSR hydration guard
    // (HomeClient, Navigation) and the viewport-width read in ScrollMenu — a
    // long-standing pattern, kept as a warning until those move to
    // useSyncExternalStore (see docs/ROADMAP.md).
    //
    // immutability / purity / refs used to be downgraded too, for the old
    // 1600-line MagicBoxClient. Since its Three.js state moved into
    // magic-box/engine (2026-11-20) nothing trips them, so they are back to
    // their defaults.
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
]);
