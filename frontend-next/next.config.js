const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  compress: true,
  poweredByHeader: false,

  webpack(config) {
    config.resolve.alias['@'] = path.resolve(__dirname, 'src')
    return config
  },

  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      // fallback : seulement si aucun fichier Next.js (Route Handler inclus) ne matche
      fallback: [
        {
          source: '/api/:path*',
          destination: `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/:path*`,
        },
      ],
    }
  },

  async headers() {
    return [
      {
        // Security headers on all routes
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options',    value: 'nosniff' },
          { key: 'X-Frame-Options',           value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=()' },
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
          { key: 'Cache-Control', value: 'public, max-age=86400' },
        ],
      },
    ]
  },

  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: '**.jumia.com' },
      { protocol: 'https', hostname: '**.jumia.com.sn' },
      { protocol: 'https', hostname: 'www.coinafrique.com' },
      { protocol: 'https', hostname: 'images.coinafrique.com' },
      { protocol: 'https', hostname: '**.dakar-auto.com' },
      { protocol: 'https', hostname: '**.expat-dakar.com' },
      { protocol: 'https', hostname: '**.vercel-storage.com' },
      { protocol: 'https', hostname: '**.electroniccorp.sn' },
      { protocol: 'https', hostname: 'electroniccorp.sn' },
      { protocol: 'https', hostname: '**.roamcdn.net' },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [64, 128, 256, 384, 512],
  },

  experimental: {
    optimizePackageImports: ['jose'],
  },
}

module.exports = nextConfig
