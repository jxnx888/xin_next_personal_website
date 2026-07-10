import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/config';

export default createMiddleware({
  locales: locales,
  defaultLocale: defaultLocale,
  localePrefix: 'always'
});

export const config = {
  // Only intercept page routes:
  // - exclude /_next/ internals
  // - exclude /api/ routes
  // - exclude any path that ends with a file extension (static assets)
  matcher: ['/((?!_next|api|.*\\.[^/]*$).*)'],
};
