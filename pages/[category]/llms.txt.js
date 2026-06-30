/**
 * ============================================
 * File: docs-frontend/pages/[category]/llms.txt.js
 * ============================================
 * Creation Reason: Provide explicit multilingual GEO endpoints such as
 * /zh-Hant/llms.txt while reusing the existing [category] dynamic route name
 * required by Next.js route sorting.
 * Modification Reason:
 *   v1.0.2 - Use localized local fallback content when backend fetches fail.
 *   v1.0.1 - Try both configured and canonical public API bases so Vercel
 *     environment drift cannot collapse localized llms endpoints to fallback.
 *   v1.0.0 - Initial language-scoped llms.txt proxy route.
 *
 * Main Functionality:
 *   - Returns text/plain localized AeroNyx GEO summaries
 *   - Proxies Django GET /api/docs/llms.txt?lang=<language>
 *   - Falls back to English when the route segment is not a supported language
 *
 * Main Logical Flow:
 *   1. Read the [category] route param as a potential language code
 *   2. Validate the value against the docs language set
 *   3. Fetch the localized backend llms.txt content
 *   4. Return text/plain without rendering React
 *
 * Dependencies:
 *   - NEXT_PUBLIC_API_BASE_URL
 *   - lib/llmsFallbacks.js
 *
 * Important Note for Next Developer:
 * - Keep this route as text/plain, not HTML.
 * - Next.js requires this file to use [category], not [language], because the
 *   docs app already has pages/[category]/[slug].js.
 *
 * Last Modified: v1.0.2 - Localized local fallback content
 * Previous: v1.0.1 - Resilient localized llms API base fallback
 * ============================================
 */

import { getLlmsFallback } from '../../lib/llmsFallbacks';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.aeronyx.network/api';
const SUPPORTED_LANGUAGES = new Set([
  'zh-Hans',
  'zh-Hant',
  'ja',
  'ko',
  'ru',
  'es',
  'pt-BR',
  'ar',
  'tr',
  'vi',
  'id',
  'fr',
]);

export default function LocalizedLlmsTxt() {
  return null;
}

async function fetchLocalizedLlms(query) {
  const apiBases = Array.from(new Set([API_BASE, 'https://api.aeronyx.network/api']));
  for (const base of apiBases) {
    const normalizedBase = String(base || '').replace(/\/+$/, '');
    try {
      const response = await fetch(`${normalizedBase}/docs/llms.txt${query}`, {
        headers: { Accept: 'text/plain' },
      });
      if (response.ok) return response.text();
    } catch {
      // Try the next base URL.
    }
  }
  return null;
}

export async function getServerSideProps({ params, res }) {
  const maybeLanguage = typeof params?.category === 'string' ? params.category : '';
  const lang = SUPPORTED_LANGUAGES.has(maybeLanguage) ? maybeLanguage : '';
  const query = lang ? `?${new URLSearchParams({ lang }).toString()}` : '';

  try {
    const text = (await fetchLocalizedLlms(query)) || getLlmsFallback(lang || 'en');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.write(text);
    res.end();
  } catch {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.write(getLlmsFallback(lang || 'en'));
    res.end();
  }

  return { props: {} };
}
