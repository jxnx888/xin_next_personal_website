'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTypewriter } from '@/lib/hooks/useTypewriter';
import { useIsMobile } from '@/lib/hooks/useDeviceType';
import AnimatedName from '@/components/home/AnimatedName';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params.locale as string;
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Parse INTRODUCTION array from translations
  const words = t.raw('INTRODUCTION') as string[];

  const { text: typedText, showCursor } = useTypewriter({
    words,
    loop: true,
    typeSpeed: 150,
    deleteSpeed: 75,
    delayBetweenWords: 2000,
  });

  const resumeLink = locale === 'zh'
    ? '/file/XinNing-Resume-CN.pdf'
    : '/file/XinNing-Resume-EN.pdf';

  // Parse KEEP_LEARNING array
  const keepLearningArray = (t.raw('KEEP_LEARNING') || ['', '', '']) as string[];

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <div
        className="relative w-full"
        style={{
          height: 0,
          paddingBottom: '29.2%',
          minHeight: '220px',
          backgroundImage: 'url(/image/banner1.png)',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'auto',
          backgroundPosition: 'center',
          backgroundColor: '#eee',
        }}
      >
        {/* Name + Title — positioned upper area like original (top 40%, translate up 60%) */}
        <div
          className="absolute text-center w-[90%] phone:w-[95%]"
          style={{ left: '50%', top: '40%', transform: 'translate(-50%, -60%)' }}
        >
          <AnimatedName
            name={t('MY_NAME')}
            style={{
              fontSize: 'clamp(40px, 5.8vw, 70px)',
              fontWeight: 900,
              color: '#333',
              textShadow: '6px 9px 2px #999',
              paddingBottom: '20px',
            }}
          />
          <p
            style={{
              color: '#8d8888',
              letterSpacing: '3px',
              fontSize: 'clamp(14px, 1.8vw, 22px)',
              animation: 'twinkling 1s 1.3s backwards',
            }}
          >
            {t('MY_TITLE')}
          </p>
        </div>

        {/* Typewriter — absolute at bottom 8% like original */}
        {mounted && (
          <div
            className="absolute text-center phone:hidden"
            style={{
              left: '50%',
              bottom: '8%',
              transform: 'translate(-50%, 0)',
              maxWidth: '650px',
              width: '90%',
            }}
          >
            <span style={{ color: '#6ba2ca', fontSize: 'clamp(16px, 2vw, 24px)' }}>
              {typedText}
            </span>
            <span
              style={{
                color: '#6ba2ca',
                opacity: showCursor ? 1 : 0,
                transition: 'opacity 0.1s',
                marginLeft: '2px',
              }}
            >
              |
            </span>
          </div>
        )}
      </div>

      {/* Welcome/About Section */}
      <div className="max-w-6xl mx-auto px-4 py-16 phone:py-8">
        <div className="text-lg text-gray-700 space-y-4 mb-12">
          {isMobile ? (
            <p>
              {t('HOME_WELCOME1')} {t('HOME_WELCOME2')}
              <a
                href={resumeLink}
                download
                className="text-blue-500 hover:text-blue-700 underline mx-1"
              >
                {t('RESUME_LOWER')}
              </a>
              . {t('HOME_WELCOME3')}{' '}
              <a href={`mailto:${t('EMAIL')}`} className="text-blue-500 hover:text-blue-700 underline">
                {t('EMAIL')}
              </a>
              , {t('HOME_WELCOME4')}{' '}
              <Link href={`/${locale}/contact`} className="text-blue-500 hover:text-blue-700 underline">
                {t('CONTACTPAGE')}
              </Link>
            </p>
          ) : (
            <>
              <p>{t('HOME_WELCOME1')}</p>
              <p>
                {t('HOME_WELCOME2')}
                <a
                  href={resumeLink}
                  download
                  className="text-blue-500 hover:text-blue-700 underline mx-1"
                >
                  {t('RESUME_LOWER')}
                </a>
              </p>
              <p>
                {t('HOME_WELCOME3')}{' '}
                <a href={`mailto:${t('EMAIL')}`} className="text-blue-500 hover:text-blue-700 underline">
                  {t('EMAIL')}
                </a>
                ,
              </p>
              <p>
                {t('HOME_WELCOME4')}{' '}
                <Link href={`/${locale}/contact`} className="text-blue-500 hover:text-blue-700 underline">
                  {t('CONTACTPAGE')}
                </Link>
              </p>
            </>
          )}
        </div>

        {/* Quick Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {/* My Projects */}
          <Link
            href={`/${locale}/projects`}
            className="group relative overflow-hidden rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
          >
            <div className="relative h-64">
              <img
                src="/image/home/myprojects.jpg"
                alt={t('My_PROJECTS')}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-70"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="text-white text-2xl font-bold">{t('My_PROJECTS')}</h3>
              </div>
            </div>
          </Link>

          {/* My Skills */}
          <Link
            href={`/${locale}/skills`}
            className="group relative overflow-hidden rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
          >
            <div className="relative h-64">
              <img
                src="/image/home/myskills.jpg"
                alt={t('MY_SKILLS')}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-70"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="text-white text-2xl font-bold">{t('MY_SKILLS')}</h3>
              </div>
            </div>
          </Link>

          {/* Blog */}
          <Link
            href={`/${locale}/blog`}
            className="group relative overflow-hidden rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
          >
            <div className="relative h-64">
              <img
                src="/image/home/blog.jpg"
                alt={t('BLOG')}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-70"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="text-white text-2xl font-bold">{t('BLOG')}</h3>
              </div>
            </div>
          </Link>
        </div>

        {/* Keep Learning Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-xl overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Image */}
            <div className="md:w-5/12 relative h-64 md:h-auto">
              <img
                src="/image/home/keep-learning.jpg"
                alt="Keep Learning"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Text */}
            <div className="md:w-7/12 p-8 md:p-12 flex items-center">
              <div>
                <h2 className="text-4xl phone:text-2xl font-bold text-gray-900 mb-8 uppercase">
                  {keepLearningArray[0]}
                </h2>
                <blockquote className="text-2xl phone:text-xl text-gray-700 italic mb-4">
                  &ldquo;{keepLearningArray[1]}&rdquo;
                </blockquote>
                <p className="text-right text-xl phone:text-lg text-gray-600">
                  -- {keepLearningArray[2]}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
