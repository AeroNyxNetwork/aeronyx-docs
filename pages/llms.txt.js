/**
 * ============================================
 * File: docs-frontend/pages/llms.txt.js
 * ============================================
 * Creation Reason: Expose AeroNyx GEO/LLM summary at /llms.txt on the docs domain.
 * Modification Reason: Initial implementation.
 *
 * Main Functionality:
 *   - Server-side proxy for Django GET /api/docs/llms.txt
 *   - Returns text/plain so AI crawlers can read the semantic summary directly
 *
 * Main Logical Flow:
 *   1. getServerSideProps fetches backend /docs/llms.txt
 *   2. Sets text/plain and cache headers
 *   3. Writes raw text response and ends the request
 *
 * Dependencies:
 *   - NEXT_PUBLIC_API_BASE_URL
 *
 * Important Note for Next Developer:
 * - Keep this route as text/plain, not HTML.
 * - The content is managed from Django Admin SiteConfig and published articles.
 *
 * Last Modified: v1.0.0 - Initial /llms.txt proxy route
 * ============================================
 */

export default function LlmsTxt() {
  return null;
}

export async function getServerSideProps({ res }) {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.aeronyx.network/api';
  const fallback = `# AeroNyx Docs

> AeroNyx documentation describes decentralized privacy infrastructure, VPN routing, encrypted communication, and DePIN node operations.

## Public data sources
- Documentation API: ${apiBase}/docs/
- Network statistics API: ${apiBase}/vpn/public/network-stats/
`;

  try {
    const response = await fetch(`${apiBase}/docs/llms.txt`, {
      headers: { Accept: 'text/plain' },
    });
    const text = response.ok ? await response.text() : fallback;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.write(text);
    res.end();
  } catch {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.write(fallback);
    res.end();
  }

  return { props: {} };
}
