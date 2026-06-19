/** @type {import('next').NextConfig} */
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const nextConfig = {
  reactStrictMode: true,
  // No images.remotePatterns wildcard: the storefront uses plain <img> tags and
  // the /uploads rewrite below, so the Next Image Optimizer is not exposed to
  // arbitrary remote hosts (avoids the remotePatterns DoS advisory).
  async rewrites() {
    // Proxy /uploads/* to the API so <img src="/uploads/.."> works from the web origin.
    return [{ source: '/uploads/:path*', destination: `${apiUrl}/uploads/:path*` }];
  },
};

module.exports = nextConfig;
