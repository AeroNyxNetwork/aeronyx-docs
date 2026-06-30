/**
 * ============================================
 * File: docs-frontend/pages/robots.txt.js
 * ============================================
 * Creation Reason: Serve a real /robots.txt file instead of allowing the
 * dynamic [category] route to render robots.txt as an HTML category page.
 * Modification Reason:
 *   v1.0.0 - Initial SEO crawler directive route for AeroNyx Docs.
 *
 * Main Functionality:
 *   - Returns text/plain robots directives
 *   - Allows public crawling
 *   - Points crawlers to /sitemap.xml
 *
 * Main Logical Flow:
 *   1. Resolve the public docs base URL
 *   2. Write crawler directives as text/plain
 *   3. End the response without rendering React
 *
 * Dependencies:
 *   - NEXT_PUBLIC_DOCS_BASE_URL, optional
 *
 * Important Note for Next Developer:
 * - Keep this route as text/plain, not HTML.
 * - Do not block AI/search crawlers unless there is a legal or security reason.
 *
 * Last Modified: v1.0.0 - Initial robots.txt route
 * ============================================
 */

export default function RobotsTxt() {
  return null;
}

export async function getServerSideProps({ res }) {
  const docsBaseUrl =
    process.env.NEXT_PUBLIC_DOCS_BASE_URL || 'https://docs.aeronyx.network';
  const body = [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${docsBaseUrl}/sitemap.xml`,
    '',
  ].join('\n');

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.write(body);
  res.end();

  return { props: {} };
}
