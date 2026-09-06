const path = require('path')

// ── Sentry (optionnel, si @sentry/nextjs installé) ──────────────
let withSentryConfig;
try {
  const SentryWebpack = require('@sentry/nextjs');
  withSentryConfig = SentryWebpack.withSentryConfig;
} catch {
  withSentryConfig = (config) => config; // no-op si pas installé
}

const withSerwist = require('@serwist/next').default({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  // Désactivé en dev ou sur demande pour isoler les builds
  disable: process.env.NODE_ENV === 'development' || process.env.DISABLE_SW === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.NEXT_OUTPUT_STANDALONE === 'true' || (process.env.NODE_ENV === 'production' && process.platform !== 'win32') ? 'standalone' : undefined,
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false, // Désactive l'export des cartes sources du code client React (Anti-Reversing)
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },


  async redirects() {
    return [
      {
        source: '/immo/boutique',
        destination: '/boutique?tab=commandes',
        permanent: false,
      },
    ]
  },

  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      // fallback : seulement si aucun fichier Next.js (Route Handler inclus) ne matche
      fallback: [
        {
          source: '/api/:path*',
          destination: `${process.env.BACKEND_URL || 'http://127.0.0.1:5000'}/api/:path*`,
        },
      ],
    }
  },

  async headers() {
    return [
      {
        // Security headers on all routes (Anti-Clonage & Anti-Framing)
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options',    value: 'nosniff' },
          { key: 'X-Frame-Options',           value: 'SAMEORIGIN' },
          { key: 'Content-Security-Policy',   value: "frame-ancestors 'self';" },
          { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',        value: 'camera=(self), microphone=(), geolocation=()' },
        ],
      },
      {
        // Aggressive caching for static assets
        source: '/icons/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
      // Note: Header pour sw.js supprimé ici car Serwist s'en charge
    ]
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: '**.jumia.com' },
      { protocol: 'https', hostname: 'jumia.com' },
      { protocol: 'https', hostname: '**.jumia.com.sn' },
      { protocol: 'https', hostname: 'jumia.com.sn' },
      { protocol: 'https', hostname: 'www.coinafrique.com' },
      { protocol: 'https', hostname: 'images.coinafrique.com' },
      { protocol: 'https', hostname: '**.dakar-auto.com' },
      { protocol: 'https', hostname: '**.expat-dakar.com' },
      { protocol: 'https', hostname: '**.vercel-storage.com' },
      { protocol: 'https', hostname: '**.electroniccorp.sn' },
      { protocol: 'https', hostname: 'electroniccorp.sn' },
      { protocol: 'https', hostname: '**.roamcdn.net' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '**.alicdn.com' },
      { protocol: 'https', hostname: '**.shein.com' },
      { protocol: 'https', hostname: '**.ltwebstatic.com' },
      { protocol: 'https', hostname: '**.media-amazon.com' },
      { protocol: 'https', hostname: '**.ssl-images-amazon.com' },
      { protocol: 'https', hostname: '**.temu.com' },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  },
}

module.exports = withSerwist(nextConfig);

