'use client';

import { ConfigProvider, theme } from 'antd';
import { useTheme } from '@/components/ThemeProvider';
import enUS from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';

export default function AntdProvider({ children, locale }: { children: React.ReactNode; locale: string }) {
  const { theme: currentTheme } = useTheme();
  const antdLocale = locale === 'zh' ? zhCN : enUS;

  return (
    <ConfigProvider
      locale={antdLocale}
      theme={{
        algorithm: currentTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#00d4ff',
          colorLink: '#00d4ff',
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}
