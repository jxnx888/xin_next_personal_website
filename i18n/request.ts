import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { locales } from './config';

// Note: `next/root-params` is next-intl's preferred source for the [locale]
// segment on Next 16, but it only exposes params of the ROOT layout. Here the
// root layout is app/layout.tsx (a passthrough that loads global CSS for the
// root-level not-found and global-error pages) and [locale] is nested below it,
// so `next/root-params` has no `locale` export. Static rendering is enabled via
// setRequestLocale() in each layout/page instead — without it every route
// builds as ƒ (dynamic) and /en and /zh stop being prerendered.
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;

  // Also guards the catch-all case: [locale] matches unknown paths too.
  if (!hasLocale(locales, requested)) {
    notFound();
  }

  return {
    locale: requested,
    messages: (await import(`../messages/${requested}.json`)).default
  };
});
