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
 *   v1.2.0 - [DOCS-IA-CMS 2026-10-09 by Claude] Redirects for merged pages
 *     and pages that moved section, in every locale.
 *
 * Last Modified: v1.2.0 - Information-architecture redirects
 * Previous: v1.0.0 - Initial creation
 * ============================================
 */

const LOCALE_PREFIXES = 'zh-Hans|zh-Hant|ja|ko|ru|es|pt-BR|ar|tr|vi|id|fr';
const DOCS_IA_REDIRECTS = [
  // Merged into the install guide.
  ['/node-operators/install-register-rust-vpn-node', '/node-operators/install-register-rust-privacy-protocol-node'],
  ['/node-operators/ai-assisted-node-deployment-standard', '/node-operators/install-register-rust-privacy-protocol-node'],
  // Nodeboard pages are one guide under Node operators.
  ['/nodeboard/nodeboard-features-reference', '/node-operators/nodeboard-operator-console-guide'],
  ['/nodeboard/nodeboard-operator-console-guide', '/node-operators/nodeboard-operator-console-guide'],
  ['/nodeboard', '/node-operators'],
  // Moved to the section their readers look in.
  ['/network/aeronyx-chat-relay-client-integration', '/developers/aeronyx-chat-relay-client-integration'],
  ['/network/aeronyx-privacy-network-vs-traditional-vpn', '/intro/aeronyx-privacy-network-vs-traditional-vpn'],
  ['/network/network-stats-and-privacy-boundary', '/node-operators/network-stats-and-privacy-boundary'],
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Preserve older public docs links after the information architecture moved
  // from whitepaper/developer labels to protocol-first pages.
  async redirects() {
    return [
      // [DOCS-IA-CMS 2026-10-09 by Claude] Pages that were merged or changed
      // section keep their old URLs, in every locale.
      ...DOCS_IA_REDIRECTS.flatMap(([source, destination]) => [
        { source, destination, permanent: true },
        {
          source: `/:lang(${LOCALE_PREFIXES})${source}`,
          destination: `/:lang${destination}`,
          permanent: true,
        },
      ]),
      // [DOCS-ARTICLE-RETIREMENT 2026-10-09 by Codex] Retire the outdated
      // Simplified Chinese snapshot without breaking bookmarks or other locales.
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
