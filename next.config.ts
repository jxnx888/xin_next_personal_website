import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 2592000,
  },
  // No `eslint` block: Next 16 removed the option and `next build` no longer
  // runs linting. Linting is `npm run lint` (ESLint CLI) — see /pre-commit.
  typescript: {
    ignoreBuildErrors: false,
  },
  // /[locale]/blog is statically generated and renders every post's content, and
  // lib/utils/notionBlog.ts paces requests to stay under Notion's ~3 req/s limit.
  // That pushes the page past the 60s default. Raised rather than lowered the
  // request count, because the list's excerpts are derived from post content.
  staticPageGenerationTimeout: 300,
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';
    const csp = [
      "default-src 'self'",
      // dev mode uses eval() for source maps — blocked without 'unsafe-eval'
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://img2023.cnblogs.com https://img2022.cnblogs.com https://common.cnblogs.com https://*.notion.so https://prod-files-secure.s3.us-west-2.amazonaws.com",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join('; ');
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
