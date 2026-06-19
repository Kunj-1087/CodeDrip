/** @type {import('next').NextConfig} */
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const nextConfig = {
  reactStrictMode: true,
  images: {
    // Allow product images served from the API's /uploads (and any future CDN).
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: '**' },
    ],
  },
  async rewrites() {
    // Proxy /uploads/* to the API so <img src="/uploads/.."> works from the web origin.
    return [{ source: '/uploads/:path*', destination: `${apiUrl}/uploads/:path*` }];
  },
};

module.exports = nextConfig;
