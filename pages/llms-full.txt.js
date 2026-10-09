/**
 * ============================================
 * File: docs-frontend/pages/llms-full.txt.js
 * ============================================
 * Creation Reason:
 *   [DOCS-GEO-LLMS-FULL 2026-10-09 by Claude] `/llms-full.txt` was caught by
 *   the `[category]` route and answered with a 200 HTML page, so crawlers that
 *   follow the llms.txt convention received markup instead of documentation.
 *
 * Main Functionality:
 *   Serves the complete Markdown of every public article in one language as
 *   text/plain: a short header, then each article with its canonical URL,
 *   summary, last update and full content.
 *
 * Main Logical Flow:
 *   1. `?lang=<code>` selects a supported language (default English).
 *   2. List the language's published articles (one API page, ≤100).
 *   3. Fetch article bodies with bounded concurrency and per-request timeouts.
 *   4. Articles that fail to load are listed with their summary only, so one
 *      slow article never removes the rest of the document.
 *
 * Dependencies:
 *   - lib/api.js (fetchArticleList, fetchArticleBySlug, articleHref,
 *     normalizeLanguage, SUPPORTED_LANGUAGES)
 *
 * ⚠️ Important Note for Next Developer:
 *   - Keep this a static route: `pages/llms-full.txt.js` must win over
 *     `pages/[category]/index.js`.
 *   - Content comes only from the CMS; do not add claims here.
 *
 * Last Modified: v1.0.0 - Initial full-text document for AI crawlers
 * ============================================
 */

import {
  SUPPORTED_LANGUAGES,
  articleHref,
  fetchArticleBySlug,
  fetchArticleList,
  normalizeLanguage,
} from '../lib/api';

const DOCS_BASE_URL = process.env.NEXT_PUBLIC_DOCS_BASE_URL || 'https://docs.aeronyx.network';
const BODY_CONCURRENCY = 6;

export default function LlmsFullTxt() {
  return null;
}

async function mapWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  async function run() {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await worker(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

function articleSection(summaryArticle, fullArticle, lang) {
  const article = fullArticle || summaryArticle;
  const url = `${DOCS_BASE_URL}${articleHref(article, lang)}`;
  const lines = [
    `## ${article.title}`,
    '',
    `URL: ${url}`,
  ];
  if (article.updated_at) lines.push(`Updated: ${article.updated_at}`);
  const summary = (article.summary || article.meta_description || '').trim();
  if (summary) lines.push('', `> ${summary}`);
  lines.push('', fullArticle?.content ? fullArticle.content.trim() : '(Full text temporarily unavailable; see the URL above.)');
  return lines.join('\n');
}

export async function getServerSideProps({ res, query }) {
  const requested = typeof query?.lang === 'string' ? query.lang : 'en';
  const lang = normalizeLanguage(requested);
  const label = SUPPORTED_LANGUAGES.find((language) => language.code === lang)?.label || 'English';

  const list = await fetchArticleList({ lang });
  const articles = Array.isArray(list) ? list : list?.results || [];

  if (!articles.length) {
    res.statusCode = 503;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Retry-After', '60');
    res.end('# AeroNyx Documentation\n\nThe documentation service is temporarily unavailable. Retry shortly.\n');
    return { props: {} };
  }

  const bodies = await mapWithConcurrency(articles, BODY_CONCURRENCY, (article) =>
    fetchArticleBySlug(article.slug, { lang }).catch(() => null)
  );

  const header = [
    '# AeroNyx Documentation — Full Text',
    '',
    `> Complete text of the AeroNyx documentation (${label}): privacy network, end-to-end encrypted chat, node operation, developer APIs and policies. Curated entry points: ${DOCS_BASE_URL}/llms.txt`,
    '',
    `Language: ${lang}. Other languages: ${SUPPORTED_LANGUAGES.map(({ code }) => `${DOCS_BASE_URL}/llms-full.txt?lang=${code}`).join(' ')}`,
    `Articles: ${articles.length}`,
  ].join('\n');

  const document = [
    header,
    ...articles.map((article, index) => articleSection(article, bodies[index], lang)),
  ].join('\n\n---\n\n');

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=600, s-maxage=3600, stale-while-revalidate=86400');
  res.setHeader('Content-Language', lang);
  res.end(`${document}\n`);
  return { props: {} };
}
