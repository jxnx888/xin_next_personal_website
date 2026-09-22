import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/config';

// Renamed from middleware.ts in Next 16: the "middleware" file convention is
// deprecated in favour of "proxy". Note proxy always runs on the nodejs runtime
// (edge is not supported here), which is fine for next-intl's locale routing.
export const proxy = createMiddleware({
  locales: locales,
  defaultLocale: defaultLocale,
  localePrefix: 'always',
  // next-intl 4 defaults NEXT_LOCALE to a session cookie. Without this, a visitor
  // whose browser language is English but who switched to 中文 would be sent back
  // to /en after closing the browser. Keep the v3 behaviour: remember the choice.
  localeCookie: { maxAge: 60 * 60 * 24 * 365 }
});

export const config = {
  // Only intercept page routes:
  // - exclude /_next/ internals
  // - exclude /api/ routes
  // - exclude any path that ends with a file extension (static assets)
  matcher: ['/((?!_next|api|.*\\.[^/]*$).*)'],
};

export default proxy;
