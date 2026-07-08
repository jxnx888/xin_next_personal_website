'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';

export default function Footer() {
  const t = useTranslations();
  const params = useParams();
  const locale = params.locale as string;
  const [showWechat, setShowWechat] = useState(false);

  const resumeLink = locale === 'zh'
    ? '/file/XinNing-Resume-CN.pdf'
    : '/file/XinNing-Resume-EN.pdf';

  const currentYear = new Date().getFullYear();

  return (
    <div style={{ background: 'var(--bg-deep)', borderTop: '1px solid var(--border-soft)' }}>
      <footer className="w-full max-w-[1200px] mx-auto text-center px-4 py-8">
        {/* Social Icons */}
        <div className="flex justify-center gap-5 mb-6">
          {/* WeChat — click to toggle QR */}
          <div className="relative">
            <div
              className="footer-icon w-9 h-9 bg-center bg-no-repeat bg-contain cursor-pointer"
              style={{ backgroundImage: "url('/image/footer/icon_wechat.png')" }}
              onClick={() => setShowWechat((v) => !v)}
              title="WeChat: Xin Ning"
            />
            {showWechat && (
              <div
                className="absolute -top-[120px] left-1/2 -translate-x-1/2 p-2 rounded-lg z-10 w-[108px] h-[108px]"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-input)' }}
              >
                <img src="/image/footer/wechat_xin.jpg" alt="WeChat QR" className="w-[90px] h-[90px]" />
              </div>
            )}
          </div>

          {/* LinkedIn */}
          <a href="https://www.linkedin.com/in/xinning1007" target="_blank" rel="noopener noreferrer" title="LinkedIn">
            <div
              className="footer-icon w-9 h-9 bg-center bg-no-repeat bg-contain"
              style={{ backgroundImage: "url('/image/footer/icon_linkedin.png')" }}
            />
          </a>

          {/* Facebook */}
          <a href="https://www.facebook.com/jxnx888" target="_blank" rel="noopener noreferrer" title="Facebook">
            <div
              className="footer-icon w-9 h-9 bg-center bg-no-repeat bg-contain"
              style={{ backgroundImage: "url('/image/footer/icon_facebook.png')" }}
            />
          </a>

          {/* GitHub */}
          <a href="https://github.com/jxnx888" target="_blank" rel="noopener noreferrer" title="GitHub">
            <div
              className="footer-icon w-9 h-9 bg-center bg-no-repeat bg-contain"
              style={{ backgroundImage: "url('/image/footer/icon_github.png')" }}
            />
          </a>
        </div>

        {/* Sitemap */}
        <div className="flex flex-wrap justify-center gap-x-1 gap-y-1 mb-5 text-sm text-[var(--text-dim)]">
          {[
            { href: resumeLink, label: t('RESUME'), download: true },
            { href: `/${locale}/`, label: t('HOME') },
            { href: `/${locale}/projects`, label: t('PROJECTS') },
            { href: `/${locale}/resume`, label: t('ABOUT_ME') },
            { href: `/${locale}/blog`, label: t('BLOG') },
            { href: `/${locale}/contact`, label: t('CONTACT') },
          ].map((item, i, arr) => (
            <span key={item.label} className="flex items-center gap-1">
              {item.download ? (
                <a href={item.href} download className="hover:text-[var(--accent)] transition-colors">{item.label}</a>
              ) : (
                <Link href={item.href} className="hover:text-[var(--accent)] transition-colors">{item.label}</Link>
              )}
              {i < arr.length - 1 && <span className="text-[var(--text-dim)] opacity-40">·</span>}
            </span>
          ))}
        </div>

        {/* Copyright */}
        <div className="text-xs text-[var(--text-dim)] tracking-widest">
          © 2015 – {currentYear} &nbsp; Xin Ning
        </div>
      </footer>
    </div>
  );
}
