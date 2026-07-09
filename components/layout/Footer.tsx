'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

export default function Footer() {
  const t = useTranslations();
  const locale = useLocale();
  const [showWechat, setShowWechat] = useState(false);
  const wechatRef = useRef<HTMLDivElement>(null);
  const wechatPopupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showWechat) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (wechatRef.current && !wechatRef.current.contains(e.target as Node)) setShowWechat(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowWechat(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showWechat]);

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
          <div className="relative" ref={wechatRef}>
            <button
              type="button"
              aria-label="WeChat: Xin Ning"
              aria-expanded={showWechat}
              className="footer-icon w-9 h-9 cursor-pointer flex items-center justify-center bg-transparent border-0 p-0"
              onClick={() => setShowWechat((v) => !v)}
            >
              <Image
                src="/image/footer/icon_wechat.png"
                alt=""
                width={36}
                height={36}
                className="w-9 h-9 object-contain"
              />
            </button>
            {showWechat && (
              <div
                ref={wechatPopupRef}
                role="dialog"
                aria-label="WeChat QR code"
                tabIndex={-1}
                className="absolute -top-[120px] left-1/2 -translate-x-1/2 p-2 rounded-lg z-10 w-[108px] h-[108px] outline-none"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-input)' }}
              >
                <Image src="/image/footer/wechat_xin.jpg" alt="WeChat QR code" width={90} height={90} />
              </div>
            )}
          </div>

          {/* LinkedIn */}
          <a
            href="https://www.linkedin.com/in/xinning1007"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit LinkedIn profile (opens in new tab)"
          >
            <Image
              src="/image/footer/icon_linkedin.png"
              alt=""
              width={36}
              height={36}
              className="footer-icon w-9 h-9 object-contain"
            />
          </a>

          {/* Facebook */}
          <a
            href="https://www.facebook.com/jxnx888"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit Facebook profile (opens in new tab)"
          >
            <Image
              src="/image/footer/icon_facebook.png"
              alt=""
              width={36}
              height={36}
              className="footer-icon w-9 h-9 object-contain"
            />
          </a>

          {/* GitHub */}
          <a
            href="https://github.com/jxnx888"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit GitHub profile (opens in new tab)"
          >
            <Image
              src="/image/footer/icon_github.png"
              alt=""
              width={36}
              height={36}
              className="footer-icon w-9 h-9 object-contain"
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
