'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useIsMobile } from '@/lib/hooks/useDeviceType';

export default function Footer() {
  const t = useTranslations();
  const params = useParams();
  const locale = params.locale as string;
  const isMobile = useIsMobile();
  const [showWechat, setShowWechat] = useState(false);

  const resumeLink = locale === 'zh'
    ? '/file/XinNing-Resume-CN.pdf'
    : '/file/XinNing-Resume-EN.pdf';

  const currentYear = new Date().getFullYear();

  return (
    <div className="bg-[#cceaf2] min-h-[100px]">
      <footer className="w-full max-w-[1200px] mx-auto text-center px-4">
        {/* Social Media Icons */}
        <div className="w-[2.5rem] h-full my-5 mx-auto flex justify-center gap-2">
          <div className="relative">
            <a
              title="WeChat:Xin Ning"
              className={`block w-12 h-12 cursor-pointer`}
              onClick={() => isMobile && setShowWechat(!showWechat)}
              onMouseEnter={() => !isMobile && setShowWechat(true)}
              onMouseLeave={() => !isMobile && setShowWechat(false)}
            >
              <div
                className="w-12 h-12 bg-cover bg-center bg-no-repeat hover:opacity-80 transition-opacity"
                style={{ backgroundImage: `url('/image/footer/icon_wechat${showWechat && !isMobile ? '_hover' : ''}.png')` }}
              />
              {showWechat && (
                <img
                  src="/image/footer/wechat_xin.jpg"
                  alt="WeChat QR Code"
                  className="absolute -top-[150px] -left-[25px] w-[100px] h-[100px]"
                />
              )}
            </a>
          </div>
          <div>
            <a
              href="https://www.linkedin.com/in/xinning1007"
              className="block w-12 h-12"
              target="_blank"
              rel="noopener noreferrer"
              title="LinkedIn:Xin Ning"
            >
              <div
                className="w-12 h-12 bg-cover bg-center bg-no-repeat hover:opacity-80 transition-opacity"
                style={{ backgroundImage: `url('/image/footer/icon_linkedin.png')` }}
              />
            </a>
          </div>
          <div>
            <a
              href="https://www.facebook.com/jxnx888"
              className="block w-12 h-12"
              target="_blank"
              rel="noopener noreferrer"
              title="Facebook:Xin Ning"
            >
              <div
                className="w-12 h-12 bg-cover bg-center bg-no-repeat hover:opacity-80 transition-opacity"
                style={{ backgroundImage: `url('/image/footer/icon_facebook.png')` }}
              />
            </a>
          </div>
          <div>
            <a
              href="https://github.com/jxnx888"
              className="block w-12 h-12"
              target="_blank"
              rel="noopener noreferrer"
              title="Github:Xin Ning"
            >
              <div
                className="w-12 h-12 bg-cover bg-center bg-no-repeat hover:opacity-80 transition-opacity"
                style={{ backgroundImage: `url('/image/footer/icon_github.png')` }}
              />
            </a>
          </div>
        </div>

        {/* Sitemap */}
        <div className="w-full max-w-[660px] mx-auto mb-5 flex flex-wrap justify-center">
          <div className="relative px-4 text-base text-[#666] phone:w-1/2 phone:mb-2 after:content-['|'] after:absolute after:-top-px after:right-0 after:text-[#666] phone:after:hidden">
            <a href={resumeLink} download className="text-[#666] hover:opacity-70">
              <i className="mr-1">📄</i>{t('RESUME')}
            </a>
          </div>
          <div className="relative px-4 text-base text-[#666] phone:w-1/2 phone:mb-2 after:content-['|'] after:absolute after:-top-px after:right-0 after:text-[#666] phone:after:hidden">
            <Link href={`/${locale}/`} className="text-[#666] hover:opacity-70">{t('HOME')}</Link>
          </div>
          <div className="relative px-4 text-base text-[#666] phone:w-1/2 phone:mb-2 after:content-['|'] after:absolute after:-top-px after:right-0 after:text-[#666] phone:after:hidden">
            <Link href={`/${locale}/skills`} className="text-[#666] hover:opacity-70">{t('SKILLS')}</Link>
          </div>
          <div className="relative px-4 text-base text-[#666] phone:w-1/2 phone:mb-2 after:content-['|'] after:absolute after:-top-px after:right-0 after:text-[#666] phone:after:hidden">
            <Link href={`/${locale}/projects`} className="text-[#666] hover:opacity-70">{t('PROJECTS')}</Link>
          </div>
          <div className="relative px-4 text-base text-[#666] phone:w-1/2 phone:mb-2 after:content-['|'] after:absolute after:-top-px after:right-0 after:text-[#666] phone:after:hidden">
            <Link href={`/${locale}/aboutme`} className="text-[#666] hover:opacity-70">{t('ABOUT_ME')}</Link>
          </div>
          <div className="relative px-4 text-base text-[#666] phone:w-1/2 phone:mb-2 after:hidden">
            <Link href={`/${locale}/contact`} className="text-[#666] hover:opacity-70">{t('CONTACT')}</Link>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-sm text-[#666] mb-5">
          Copyright 2015 - {currentYear} | Xin Ning
        </div>
      </footer>
    </div>
  );
}
