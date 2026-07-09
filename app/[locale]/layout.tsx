import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import AntdProvider from '@/components/AntdProvider';
import { notFound } from 'next/navigation';
import { locales, type Locale } from '@/i18n/config';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import { ThemeProvider } from '@/components/ThemeProvider';

const antiFlashScript = `(function(){try{var s=localStorage.getItem('theme');if(s==='light'){document.documentElement.classList.add('light');}else if(!s&&!window.matchMedia('(prefers-color-scheme: dark)').matches){document.documentElement.classList.add('light');}}catch(e){}})();`;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const title = t('META_TITLE');
  const description = t('META_DESCRIPTION');
  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
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
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate locale
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // Providing all messages to the client
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: antiFlashScript }} />
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            <AntdRegistry>
              <AntdProvider locale={locale}>
                <Navigation />
                <main className="pt-[80px] phone:pt-[56px] pad-v:pt-[56px]">
                  {children}
                </main>
                <Footer />
              </AntdProvider>
            </AntdRegistry>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
