import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/config';

export default createMiddleware({
  // A list of all locales that are supported
  locales: locales,

  // Used when no locale matches
  defaultLocale: defaultLocale,

  // Always use the prefix for the default locale
  localePrefix: 'always'
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff2?|ttf|eot|otf|css|js|mjs|json|pdf|txt|xml|mp3|mp4|webm|ogg|wav|stl|obj|mtl|html|zip|wasm|map)).*)',
  ],
};
