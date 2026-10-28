import type { MetadataRoute } from 'next';

/** Makes Porchlight installable ("Add to Home Screen"), which iPhones require for push alerts. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Porchlight',
    short_name: 'Porchlight',
    description: 'Find the best holiday houses near you, check in, vote, and help a neighbor win the pot.',
    start_url: '/?source=app',
    scope: '/',
    display: 'standalone',
    background_color: '#14123a',
    theme_color: '#14123a',
    icons: [
      { src: '/app-icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/app-icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/app-icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Plan a route', url: '/route', icons: [{ src: '/app-icons/icon-192.png', sizes: '192x192' }] },
      { name: 'Caravan', url: '/caravan', icons: [{ src: '/app-icons/icon-192.png', sizes: '192x192' }] },
    ],
  };
}
