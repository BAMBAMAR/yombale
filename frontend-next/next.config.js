const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config) {
    config.resolve.alias['@'] = path.resolve(__dirname, 'src')
    return config
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/:path*`,
      },
    ];
  },

  images: {
    // Domaines autorisés explicitement — pas de wildcard `**`
    remotePatterns: [
      // Cloudinary (logos boutiques, photos annonces)
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      // Marchands sénégalais scrappés
      { protocol: 'https', hostname: '**.jumia.com' },
      { protocol: 'https', hostname: '**.jumia.com.sn' },
      { protocol: 'https', hostname: 'www.coinafrique.com' },
      { protocol: 'https', hostname: 'images.coinafrique.com' },
      { protocol: 'https', hostname: '**.dakar-auto.com' },
      { protocol: 'https', hostname: '**.expat-dakar.com' },
      // Fallback pour images scrappées non listées (à affiner au fil du temps)
      { protocol: 'https', hostname: '**.vercel-storage.com' },
    ],
    // Formats modernes en priorité
    formats: ['image/avif', 'image/webp'],
  },
};

module.exports = nextConfig;
