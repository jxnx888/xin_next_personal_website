import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import AntdProvider from '@/components/AntdProvider';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { locales, type Locale } from '@/i18n/config';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';


export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const title = t('META_TITLE');
  const description = t('META_DESCRIPTION');
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
    title,
    description,
    icons: {
      icon: [
        { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
      apple: '/apple-touch-icon.png',
    },
    openGraph: {
      title,
      description,
      type: 'website',
      locale: locale === 'zh' ? 'zh_CN' : 'en_US',
      images: [{ url: '/image/banner1.png', width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/image/banner1.png'],
    },
    // Each page sets its own alternates.languages in generateMetadata
    // to avoid emitting the same wrong hreflang on every route.
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  // Next's generated LayoutConfig constraint requires the raw `string` here,
  // so this one stays untyped and is narrowed below.
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate locale
  if (!hasLocale(locales, locale)) {
    notFound();
  }

  // Enables static rendering. Without it next-intl resolves the locale from
  // request data and every route builds as dynamic instead of prerendering.
  setRequestLocale(locale);

  const htmlLang = locale === 'zh' ? 'zh-CN' : 'en';

  return (
    <html lang={htmlLang} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <NextIntlClientProvider>
          <ThemeProvider>
            <AntdRegistry>
              <AntdProvider locale={locale}>
                <Navigation />
                <main id="main-content" tabIndex={-1} className="pt-[80px] phone:pt-[56px] pad-v:pt-[56px] outline-none">
                  {children}
                </main>
                <Footer />
              </AntdProvider>
            </AntdRegistry>
          </ThemeProvider>
        </NextIntlClientProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
