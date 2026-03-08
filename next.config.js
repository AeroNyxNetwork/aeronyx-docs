/**
 * ============================================
 * next.config.js - Next.js Configuration
 * ============================================
 * Creation Reason: Configure Next.js for docs frontend
 * Main Functionality:
 *   - API proxy to avoid CORS issues
 *   - Image domain whitelist
 *   - Output configuration
 *
 * ⚠️ Important Note for Next Developer:
 * - API_BASE_URL must match your Django backend
 * - rewrites() proxies /api/* to Django backend
 *
 * Last Modified: v1.0.0 - Initial creation
 * ============================================
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Proxy API requests to Django backend
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.aeronyx.network/api'}/:path*`,
      },
    ];
  },

  // Allow images from these domains
  images: {
    domains: [
      'api.aeronyx.network',
      'binary.aeronyx.network',
    ],
    unoptimized: false,
  },

  // SEO: trailing slash consistency
  trailingSlash: false,
};

module.exports = nextConfig;
