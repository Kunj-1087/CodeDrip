/** @type {import('next').NextConfig} */
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const nextConfig = {
  reactStrictMode: true,

  // Image optimization: enable AVIF/WebP formats, configure device sizes, and
  // add the backend domain as a remote pattern so product images are optimized.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: new URL(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').hostname,
      },
      // Allow images from Unsplash (used in seed data for product photos).
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      // Allow images from other common image hosts.
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '**.imgix.net',
      },
    ],
    unoptimized: true, // Skip Next.js image optimization for external images

    formats: ['image/avif', 'image/webp'],
    deviceSizes: [375, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [64, 128, 256, 384],
    minimumCacheTTL: 86400, // Cache optimized images for 24 hours on Vercel edge.
  },

  // Enable HTTP compression on responses.
  compress: true,

  // Production build: strip console.log statements to reduce bundle size.
  // console.error and console.warn are preserved for error reporting.
  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? { exclude: ['error', 'warn'] }
        : false,
  },

  // Proxy /uploads/* to the API so <img src="/uploads/.."> works from the web origin.
  async rewrites() {
    return [{ source: '/uploads/:path*', destination: `${apiUrl}/uploads/:path*` }];
  },

  // Security headers applied at the Vercel edge for every response.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
