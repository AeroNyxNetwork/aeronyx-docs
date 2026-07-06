/**
 * ============================================
 * next.config.js - Next.js Configuration
 * ============================================
 * Creation Reason: Configure Next.js for docs frontend
 * Modification Reason:
 *   v1.1.0 - Added permanent redirects for legacy docs URLs that were linked
 *     from older website CTAs and GEO/SEO indexes. These redirects preserve
 *     external citations while the docs move toward protocol-first pages.
 *
 * Main Functionality:
 *   - API proxy to avoid CORS issues
 *   - Image domain whitelist
 *   - Output configuration
 *   - Legacy documentation URL redirects
 *
 * ⚠️ Important Note for Next Developer:
 * - API_BASE_URL must match your Django backend
 * - rewrites() proxies /api/* to Django backend
 * - redirects() preserves public links used by website CTAs, search engines,
 *   and AI crawler summaries.
 *
 * Last Modified: v1.1.0 - Legacy docs URL redirects
 * Previous: v1.0.0 - Initial creation
 * ============================================
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Preserve older public docs links after the information architecture moved
  // from whitepaper/developer labels to protocol-first pages.
  async redirects() {
    return [
      {
        source: '/aeronyx-whitepaper/technical-white-paper',
        destination: '/intro/aeronyx-app-and-protocol-architecture',
        permanent: true,
      },
      {
        source: '/developer-documentation/overview',
        destination: '/network/node-discovery-and-relay-foundation',
        permanent: true,
      },
    ];
  },

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
