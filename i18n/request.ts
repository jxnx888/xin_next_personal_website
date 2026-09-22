import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, type Locale } from './config';

function isLocale(value: string | undefined): value is Locale {
  return !!value && locales.includes(value as Locale);
}

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  const requested = await requestLocale;

  // Ensure that a valid locale is used. next-intl 4 requires `locale` in the
  // returned config to be the narrowed Locale type, so use a type guard rather
  // than an inline includes() check — the latter does not narrow.
  if (!isLocale(requested)) {
    notFound();
  }

  return {
    locale: requested,
    messages: (await import(`../messages/${requested}.json`)).default
  };
});
