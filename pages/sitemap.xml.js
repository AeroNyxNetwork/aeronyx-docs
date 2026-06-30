/**
 * ============================================
 * File: docs-frontend/pages/sitemap.xml.js
 * ============================================
 * Creation Reason: Serve a real /sitemap.xml file for SEO and GEO crawlers
 * instead of letting the dynamic [category] route render sitemap.xml as HTML.
 * Modification Reason:
 *   v1.0.0 - Initial multilingual sitemap route with article alternates.
 *
 * Main Functionality:
 *   - Fetches published docs articles from the Django docs API
 *   - Emits home, category, article, network-stats, and llms URLs
 *   - Adds xhtml:link alternates for multilingual article clusters
 *
 * Main Logical Flow:
 *   1. Fetch article lists for every supported docs language
 *   2. Group articles by translation_key/canonical_slug
 *   3. Build XML urlset with canonical URLs and language alternates
 *   4. Return application/xml without rendering React
 *
 * Dependencies:
 *   - NEXT_PUBLIC_API_BASE_URL
 *   - NEXT_PUBLIC_DOCS_BASE_URL
 *
 * Important Note for Next Developer:
 * - Keep this route XML-only.
 * - category_slug and canonical_slug come from ArticleListSerializer.
 * - Do not include private operator URLs or authenticated nodeboard routes.
 *
 * Last Modified: v1.0.0 - Initial multilingual sitemap route
 * ============================================
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.aeronyx.network/api';
const DOCS_BASE_URL =
  process.env.NEXT_PUBLIC_DOCS_BASE_URL || 'https://docs.aeronyx.network';

const LANGUAGES = [
  'en',
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
];

function languagePathPrefix(lang) {
  return lang === 'en' ? '' : `/${lang}`;
}

function escapeXml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function normalizeArticleList(json) {
  if (!json) return [];
  if (Array.isArray(json)) return json;
  if (Array.isArray(json.results)) return json.results;
  if (json.code === 0 && Array.isArray(json.data)) return json.data;
  if (json.code === 0 && Array.isArray(json.data?.results)) return json.data.results;
  return [];
}

async function fetchArticles(lang) {
  const params = new URLSearchParams();
  if (lang !== 'en') params.set('lang', lang);
  const query = params.toString();
  const url = `${API_BASE}/docs/articles/${query ? `?${query}` : ''}`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) return [];
  return normalizeArticleList(await response.json());
}

function articleUrl(article, lang) {
  const categorySlug = article.category_slug || 'uncategorized';
  const slug = article.canonical_slug || article.translation_key || article.slug;
  return `${DOCS_BASE_URL}${languagePathPrefix(lang)}/${categorySlug}/${slug}`;
}

function urlEntry({ loc, lastmod, alternates = [], changefreq = 'weekly', priority = '0.7' }) {
  const alternateXml = alternates
    .map(
      ({ lang, href }) =>
        `    <xhtml:link rel="alternate" hreflang="${escapeXml(lang)}" href="${escapeXml(href)}" />`
    )
    .join('\n');
  return [
    '  <url>',
    `    <loc>${escapeXml(loc)}</loc>`,
    lastmod ? `    <lastmod>${escapeXml(lastmod)}</lastmod>` : '',
    `    <changefreq>${escapeXml(changefreq)}</changefreq>`,
    `    <priority>${escapeXml(priority)}</priority>`,
    alternateXml,
    '  </url>',
  ]
    .filter(Boolean)
    .join('\n');
}

export default function SitemapXml() {
  return null;
}

export async function getServerSideProps({ res }) {
  const articleLists = await Promise.all(
    LANGUAGES.map(async (lang) => [lang, await fetchArticles(lang)])
  );

  const articlesByLang = Object.fromEntries(articleLists);
  const categories = new Set();
  const articleGroups = new Map();

  for (const [lang, articles] of articleLists) {
    for (const article of articles) {
      if (article.category_slug) categories.add(article.category_slug);
      const key = article.translation_key || article.canonical_slug || article.slug;
      if (!key) continue;
      if (!articleGroups.has(key)) articleGroups.set(key, {});
      articleGroups.get(key)[lang] = article;
    }
  }

  const now = new Date().toISOString();
  const entries = [];

  const homeAlternates = LANGUAGES.map((lang) => ({
    lang,
    href: `${DOCS_BASE_URL}${languagePathPrefix(lang) || '/'}`,
  }));
  homeAlternates.push({ lang: 'x-default', href: `${DOCS_BASE_URL}/` });
  for (const lang of LANGUAGES) {
    entries.push(
      urlEntry({
        loc: `${DOCS_BASE_URL}${languagePathPrefix(lang) || '/'}`,
        lastmod: now,
        alternates: homeAlternates,
        changefreq: 'daily',
        priority: lang === 'en' ? '1.0' : '0.9',
      })
    );
  }

  for (const categorySlug of Array.from(categories).sort()) {
    const alternates = LANGUAGES.map((lang) => ({
      lang,
      href: `${DOCS_BASE_URL}${languagePathPrefix(lang)}/${categorySlug}`,
    }));
    alternates.push({ lang: 'x-default', href: `${DOCS_BASE_URL}/${categorySlug}` });
    for (const lang of LANGUAGES) {
      entries.push(
        urlEntry({
          loc: `${DOCS_BASE_URL}${languagePathPrefix(lang)}/${categorySlug}`,
          lastmod: now,
          alternates,
          changefreq: 'weekly',
          priority: '0.7',
        })
      );
    }
  }

  for (const group of articleGroups.values()) {
    const alternates = LANGUAGES.map((lang) => {
      const article = group[lang] || group.en || Object.values(group)[0];
      return { lang, href: articleUrl(article, lang) };
    });
    const defaultArticle = group.en || Object.values(group)[0];
    alternates.push({ lang: 'x-default', href: articleUrl(defaultArticle, 'en') });

    for (const lang of LANGUAGES) {
      const article = group[lang];
      if (!article) continue;
      entries.push(
        urlEntry({
          loc: articleUrl(article, lang),
          lastmod: article.updated_at || article.published_at || now,
          alternates,
          changefreq: 'weekly',
          priority: article.is_pinned ? '0.9' : '0.8',
        })
      );
    }
  }

  entries.push(
    urlEntry({
      loc: `${DOCS_BASE_URL}/network-stats`,
      lastmod: now,
      changefreq: 'hourly',
      priority: '0.8',
    })
  );
  entries.push(
    urlEntry({
      loc: `${DOCS_BASE_URL}/llms.txt`,
      lastmod: now,
      changefreq: 'daily',
      priority: '0.6',
    })
  );
  for (const lang of LANGUAGES.filter((item) => item !== 'en')) {
    entries.push(
      urlEntry({
        loc: `${DOCS_BASE_URL}${languagePathPrefix(lang)}/llms.txt`,
        lastmod: now,
        changefreq: 'daily',
        priority: '0.6',
      })
    );
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    entries.join('\n'),
    '</urlset>',
    '',
  ].join('\n');

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=1800');
  res.write(xml);
  res.end();

  return { props: {} };
}
