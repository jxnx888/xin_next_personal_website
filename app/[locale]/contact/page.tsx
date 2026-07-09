'use client';

import { useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import PageBanner from '@/components/layout/PageBanner';
import SectionCard from '@/components/ui/SectionCard';

const INPUT_CLASS = 'contact-input w-full px-4 py-3 rounded-lg text-[var(--text)] text-sm';

export default function ContactPage() {
  const t = useTranslations();
  const tc = useTranslations('contact');

  const topTitle   = tc.raw('topTitle')   as string[];
  const getInTouch = tc.raw('getInTouch') as string[];
  const msg        = tc.raw('message')    as string[];
  const validation = tc.raw('validation') as string[];

  const [formData, setFormData] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [errors, setErrors]     = useState({ name: false, email: false, emailInvalid: false, phone: false, subject: false, message: false });
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const validateEmail = (email: string) =>
    /^\w+((-\w+)|(\.\w+))*@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z0-9]+$/.test(email);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: false, emailInvalid: false }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = {
      name:         !formData.name,
      email:        !formData.email,
      emailInvalid: !!(formData.email && !validateEmail(formData.email)),
      phone:        !formData.phone,
      subject:      !formData.subject,
      message:      !formData.message,
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;
    setSubmitState('submitting');
    setTimeout(() => {
      setSubmitState('success');
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      setTimeout(() => setSubmitState('idle'), 3000);
    }, 1000);
  };

  const errorOverlay = (errMsg: string, onClear: () => void) => (
    <div
      className="absolute inset-0 rounded-lg px-4 py-3 text-sm text-red-400 cursor-pointer flex items-center"
      style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(248,81,73,0.4)' }}
      onClick={onClear}
    >
      {errMsg}
    </div>
  );

  const contactItems: Array<{ href: string; text: string; icon: ReactNode; external?: boolean }> = [
    {
      href: 'tel:+8618535424777',
      text: '+86 185 3542 4777',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
    },
    {
      href: 'mailto:ningxin1007@hotmail.com',
      text: 'ningxin1007@hotmail.com',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      href: 'https://www.linkedin.com/in/xin-ning-28818b115/',
      text: 'linkedin.com/in/xin-ning',
      external: true,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
    },
    {
      href: 'https://www.facebook.com/jxnx888',
      text: 'facebook.com/jxnx888',
      external: true,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073C24 5.404 18.627 0 12 0S0 5.404 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.269h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
        </svg>
      ),
    },
  ];

  const SectionLabel = ({ num, title }: { num: string; title: string }) => (
    <div className="flex items-center gap-4 mb-6">
      <span
        className="text-5xl phone:text-3xl font-black select-none"
        style={{ color: 'var(--text-dim)', opacity: 0.3, letterSpacing: '-2px' }}
      >
        {num}
      </span>
      <div>
        <div className="text-xs text-[var(--text-dim)] tracking-widest uppercase mb-0.5">{t('SECTION')}</div>
        <h2 className="text-xl phone:text-lg font-bold text-[var(--text)] leading-tight">{title}</h2>
      </div>
    </div>
  );

  const emailHasError = errors.email || errors.emailInvalid;
  const emailErrMsg   = errors.email ? validation[1] : validation[2];

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <PageBanner title={topTitle[0]} />

      <div className="max-w-6xl mx-auto px-4 py-12 phone:py-8">
        <p className="text-[var(--text-muted)] text-sm text-center mb-8">{topTitle[1]}</p>

        {/* Default: 2 cols; phone/pad-v: 1 col */}
        <div className="grid grid-cols-2 phone:grid-cols-1 pad-v:grid-cols-1 gap-6">

          {/* Get In Touch */}
          <SectionCard className="p-8 phone:p-6">
            <SectionLabel num="01" title={tc('sectionGetInTouch')} />

            <p className="text-[var(--text-muted)] mb-2 text-sm leading-relaxed">{getInTouch[0]}</p>
            <p className="text-[var(--text-muted)] mb-8 text-sm leading-relaxed">{getInTouch[1]}</p>

            <div className="space-y-4">
              {contactItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className="flex items-center gap-3 text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors duration-200 text-sm"
                >
                  <span
                    className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
                    style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.15)' }}
                  >
                    {item.icon}
                  </span>
                  <span>{item.text}</span>
                </a>
              ))}
            </div>
          </SectionCard>

          {/* Send Message */}
          <SectionCard className="p-8 phone:p-6">
            <SectionLabel num="02" title={tc('sectionSendMessage')} />

            <form onSubmit={handleSubmit} className="space-y-3">
              {[
                { name: 'name',    type: 'text',  placeholder: msg[0], hasError: errors.name,    errMsg: validation[0] },
                { name: 'email',   type: 'email', placeholder: msg[1], hasError: emailHasError,  errMsg: emailErrMsg },
                { name: 'phone',   type: 'tel',   placeholder: msg[2], hasError: errors.phone,   errMsg: validation[3] },
                { name: 'subject', type: 'text',  placeholder: msg[3], hasError: errors.subject, errMsg: validation[4] },
              ].map((field) => (
                <div key={field.name} className="relative">
                  <input
                    type={field.type}
                    name={field.name}
                    value={formData[field.name as keyof typeof formData]}
                    onChange={handleInputChange}
                    placeholder={field.placeholder}
                    className={INPUT_CLASS}
                  />
                  {field.hasError && errorOverlay(field.errMsg, () =>
                    setErrors(e => ({ ...e, [field.name]: false, emailInvalid: false }))
                  )}
                </div>
              ))}

              <div className="relative">
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder={msg[4]}
                  rows={4}
                  className={INPUT_CLASS}
                  style={{ resize: 'none' }}
                />
                {errors.message && errorOverlay(validation[5], () =>
                  setErrors(e => ({ ...e, message: false }))
                )}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={submitState === 'submitting'}
                  className="btn-glow-primary w-full py-3 px-6 rounded-lg font-bold text-sm tracking-widest uppercase"
                >
                  {submitState === 'submitting' ? t('SENDING') : msg[5]}
                </button>
                {submitState === 'success' && (
                  <p className="mt-2 text-sm text-center text-green-400">{validation[7]}</p>
                )}
                {submitState === 'error' && (
                  <p className="mt-2 text-sm text-center text-red-400">{validation[6]}</p>
                )}
              </div>
            </form>
          </SectionCard>

        </div>
      </div>
    </div>
  );
}
