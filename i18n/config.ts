export const locales = ['en', 'zh'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

// next-intl 4 type augmentation — module-scoped, no longer global.
// Narrows `useLocale()` and the `locale` option of `getTranslations()` from
// `string` to 'en' | 'zh'.
//
// `Messages` is deliberately NOT registered here. Several message values are
// arrays (KEEP_LEARNING, INTRODUCTION, FEATURED_PROJECTS, contact.topTitle,
// contact.getInTouch, contact.message, contact.validation) and next-intl's
// NestedKeyOf walks `keyof string[]`, which pulls in the array's numeric index
// signature and collapses the whole key union to `string`. NamespaceKeys then
// resolves to `never`, breaking every `useTranslations('namespace')` call.
// Registering Messages requires converting those arrays to objects first.
declare module 'next-intl' {
  interface AppConfig {
    Locale: Locale;
  }
}
