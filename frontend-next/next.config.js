/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'}/api/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
};
module.exports = nextConfig;
