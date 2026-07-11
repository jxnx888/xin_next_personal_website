'use client';

import { ConfigProvider, theme } from 'antd';
import enUS from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';

export default function AntdProvider({ children, locale }: { children: React.ReactNode; locale: string }) {
  const antdLocale = locale === 'zh' ? zhCN : enUS;

  return (
    <ConfigProvider
      locale={antdLocale}
      theme={{
        algorithm: theme.darkAlgorithm,
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
