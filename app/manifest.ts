import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Xin Ning — Full-Stack Developer',
    short_name: 'Xin Ning',
    description: 'Personal portfolio of Xin Ning, Full-Stack Developer with 8+ years of experience.',
    start_url: '/en',
    display: 'minimal-ui',
    background_color: '#080c18',
    theme_color: '#00d4ff',
    icons: [
      { src: '/favicon.ico', sizes: 'any', type: 'image/x-icon' },
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
