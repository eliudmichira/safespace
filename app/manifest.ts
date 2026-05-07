import type { MetadataRoute } from 'next'

export const dynamic = 'force-static'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SafeSpace - GBV Emergency Response',
    short_name: 'SafeSpace',
    description: 'AI-driven Gender-Based Violence Reporting and Emergency Response System',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0b14', // Match the Navy base
    theme_color: '#f472b6', // Match the Pink branding
    icons: [
      {
        src: '/icon-light-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/icon-dark-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  }
}
