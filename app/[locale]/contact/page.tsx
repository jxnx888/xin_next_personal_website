'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

export default function ContactPage() {
  const t = useTranslations('contact');
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  const [formData, setFormData] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [errors, setErrors] = useState({ name: false, email: false, emailInvalid: false, phone: false, subject: false, message: false });
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoieGlubmluZyIsImEiOiJjanJ6ZjBrejYwM2NyNDRwajRxYnNxODJ1In0.1234';
    map.current = new mapboxgl.Map({ container: mapContainer.current, style: 'mapbox://styles/mapbox/streets-v12', center: [-73.56244160935152, 45.49302570938374], zoom: 15 });
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    new mapboxgl.Marker({ color: '#FF5722' }).setLngLat([-73.56244160935152, 45.49302570938374]).setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML('<h3 style="margin:0;font-size:14px;font-weight:bold;">Shanghai Kairong</h3><p style="margin:5px 0 0 0;font-size:12px;">601 Yunling Lu, Shanghai</p>')).addTo(map.current);
    return () => { if (map.current) map.current.remove(); };
  }, []);

  const validateEmail = (email: string) => /^\w+((-\w+)|(\.\w+))*@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z0-9]+$/.test(email);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: false, emailInvalid: false }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = { name: !formData.name, email: !formData.email, emailInvalid: !!(formData.email && !validateEmail(formData.email)), phone: !formData.phone, subject: !formData.subject, message: !formData.message };
    setErrors(newErrors);
    if (Object.values(newErrors).some(error => error)) return;
    setSubmitState('submitting');
    setTimeout(() => { setSubmitState('success'); setFormData({ name: '', email: '', phone: '', subject: '', message: '' }); setTimeout(() => setSubmitState('idle'), 3000); }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div ref={mapContainer} className="w-full h-96 phone:h-64" />
      <div className="max-w-7xl mx-auto px-4 py-12 phone:py-8">
        <h1 className="text-4xl phone:text-2xl font-bold text-gray-800 mb-2 text-center">{t('topTitle[0]')}</h1>
        <p className="text-lg phone:text-base text-gray-600 mb-12 phone:mb-8 text-center">{t('topTitle[1]')}</p>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-lg p-8 phone:p-6">
            <div className="mb-6"><div className="flex items-center gap-4 mb-4"><span className="text-6xl phone:text-4xl font-bold text-gray-800">01</span><span className="text-3xl phone:text-xl font-bold text-gray-800 leading-tight">GET IN<br/>TOUCH</span></div></div>
            <p className="text-gray-700 mb-2 phone:text-sm">{t('getInTouch[0]')}</p>
            <p className="text-gray-700 mb-6 phone:text-sm">{t('getInTouch[1]')}</p>
            <div className="space-y-4">
              <a href="tel:+8618535424777" className="flex items-center gap-3 text-gray-700 hover:text-orange-500 transition-colors"><span className="text-2xl">📞</span><span>+86 18535424777</span></a>
              <a href="mailto:ningxin1007@hotmail.com" className="flex items-center gap-3 text-gray-700 hover:text-orange-500 transition-colors"><span className="text-2xl">✉️</span><span>ningxin1007@hotmail.com</span></a>
              <a href="https://www.linkedin.com/in/xin-ning-28818b115/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-700 hover:text-orange-500 transition-colors"><span className="text-2xl">💼</span><span>@Xin Ning</span></a>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-8 phone:p-6">
            <div className="mb-6"><div className="flex items-center gap-4 mb-4"><span className="text-6xl phone:text-4xl font-bold text-gray-800">02</span><span className="text-3xl phone:text-xl font-bold text-gray-800 leading-tight">SEND ME<br/>A MESSAGE</span></div></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative"><input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder={t('message[0]')} className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500"/>{errors.name && <div className="absolute inset-0 bg-white border border-red-500 rounded px-4 py-3 text-red-500 cursor-pointer" onClick={() => setErrors(e => ({...e, name: false}))}>{t('validation[0]')}</div>}</div>
              <div className="relative"><input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder={t('message[1]')} className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500"/>{(errors.email || errors.emailInvalid) && <div className="absolute inset-0 bg-white border border-red-500 rounded px-4 py-3 text-red-500 cursor-pointer" onClick={() => setErrors(e => ({...e, email: false, emailInvalid: false}))}>{errors.email ? t('validation[1]') : t('validation[2]')}</div>}</div>
              <div className="relative"><input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder={t('message[2]')} className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500"/>{errors.phone && <div className="absolute inset-0 bg-white border border-red-500 rounded px-4 py-3 text-red-500 cursor-pointer" onClick={() => setErrors(e => ({...e, phone: false}))}>{t('validation[3]')}</div>}</div>
              <div className="relative"><input type="text" name="subject" value={formData.subject} onChange={handleInputChange} placeholder={t('message[3]')} className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500"/>{errors.subject && <div className="absolute inset-0 bg-white border border-red-500 rounded px-4 py-3 text-red-500 cursor-pointer" onClick={() => setErrors(e => ({...e, subject: false}))}>{t('validation[4]')}</div>}</div>
              <div className="relative"><textarea name="message" value={formData.message} onChange={handleInputChange} placeholder={t('message[4]')} rows={5} className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500"/>{errors.message && <div className="absolute inset-0 bg-white border border-red-500 rounded px-4 py-3 text-red-500 cursor-pointer" onClick={() => setErrors(e => ({...e, message: false}))}>{t('validation[5]')}</div>}</div>
              <div><button type="submit" disabled={submitState === 'submitting'} className={`w-full py-3 px-6 rounded font-bold text-white transition-colors ${submitState === 'submitting' ? 'bg-gray-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600'}`}>{submitState === 'submitting' ? 'SUBMITTING...' : t('message[5]')}</button>{submitState === 'error' && <div className="mt-2 text-red-500 text-sm">{t('validation[6]')}</div>}{submitState === 'success' && <div className="mt-2 text-green-500 text-sm">{t('validation[7]')}</div>}</div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
