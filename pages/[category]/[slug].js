/**
 * ============================================
 * File: docs-frontend/pages/[category]/[slug].js
 * ============================================
 * Creation Reason: Article detail page with full Markdown rendering
 * Modification Reason:
 *   v1.1.5 - [DOCS-UX 2026-08-04 by Codex] Suppress the summary callout only
 *     when it exactly duplicates the first Markdown paragraph.
 *   v1.1.4 - [DOCS-UX 2026-08-04 by Codex] Fix conditional hook ordering,
 *     estimate CJK reading time correctly, and refine mobile article layout.
 *   v1.1.3 - Add self-referencing canonical URLs and JSON-LD structured data
 *     for article and breadcrumb discovery.
 *   v1.1.2 - Localize article metadata dates so translated pages do not keep
 *     English month names in the byline.
 *   v1.1.1 - Stabilized TOC memoization and removed article-level
 *   framer-motion wrapper to prevent client-side route cancellation /
 *   removeChild crashes during markdown page navigation.
 *   v1.1.0 - Pass SiteConfig into Layout for admin-controlled SEO/header.
 *   v1.0.1 - Added reading progress bar, fixed prev/next
 *   links to use correct category slug from article data instead of URL param
 *   (BUG: if article moved categories, links would 404). Improved TOC
 *   active state tracking. Added estimated reading time.
 *
 * Main Logical Flow:
 *   1. getServerSideProps fetches article by slug + category tree
 *   2. Returns 404 if article not found
 *   3. Renders breadcrumb, metadata, Markdown content, TOC, prev/next nav
 *   4. Reading progress bar tracks scroll position
 *   5. TOC highlights active heading via IntersectionObserver
 *
 * Dependencies:
 *   - lib/api.js (fetchSiteConfig, fetchArticleBySlug, fetchCategoryTree)
 *   - components/Layout.js, components/MarkdownRenderer.js
 *   - lucide-react (icons)
 *
 * ⚠️ Important Note for Next Developer:
 * - TOC is extracted client-side from markdown headings
 * - Article views are incremented server-side by Django on each fetch
 * - prev_article / next_article come from ArticleDetailSerializer
 * - BUG FIX: prev/next links now use article.category_slug (from API)
 *   instead of the URL categorySlug param, since articles might change category
 *
 * Last Modified: v1.1.5 - Duplicate-summary guard
 * ============================================
 */

import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Clock, Eye, User, ChevronLeft, ChevronRight, BookOpen, FileText } from 'lucide-react';
import Layout from '../../components/Layout';
import CategoryPage, { getCategoryPageProps } from './index';
import MarkdownRenderer, { extractTOC } from '../../components/MarkdownRenderer';
import {
  articleHref,
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  fetchSiteConfig,
  fetchArticleBySlug,
  fetchCategoryTree,
  getUiCopy,
  languageLocale,
  languagePathPrefix,
  normalizeLanguage,
} from '../../lib/api';

// ============================================
// Estimated reading time utility
// ============================================

function estimateReadTime(content) {
  if (!content) return 0;
  const readableText = content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#*_`>\[\]()~-]/g, ' ');
  const cjkCharacters = readableText.match(
    /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu
  )?.length || 0;
  const nonCjkWords = readableText
    .replace(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu, ' ')
    .match(/[\p{L}\p{N}]+/gu)?.length || 0;

  return Math.max(1, Math.ceil((cjkCharacters / 450) + (nonCjkWords / 220)));
}

function normalizeComparableText(value) {
  return (value || '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`>#]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function summaryRepeatsFirstParagraph(content, summary) {
  if (!content || !summary) return false;
  const withoutDocumentTitle = content
    .replace(/^\uFEFF/, '')
    .replace(/^\s*#\s+.+(?:\r?\n|$)/, '')
    .trimStart();
  const firstParagraph = withoutDocumentTitle.split(/\r?\n\s*\r?\n/, 1)[0];
  return normalizeComparableText(firstParagraph) === normalizeComparableText(summary);
}

// ============================================
// Main Component
// ============================================

export default function ArticlePage({
  pageKind = 'article',
  siteConfig,
  categoryTree,
  articles,
  categoryInfo,
  article,
  categorySlug,
  currentLanguage = DEFAULT_LANGUAGE,
}) {
  const router = useRouter();
  const [activeHeading, setActiveHeading] = useState('');
  const [readProgress, setReadProgress] = useState(0);
  const copy = getUiCopy(currentLanguage);

  // Extract TOC from markdown.
  // Keep the array stable so scroll progress renders do not recreate the
  // IntersectionObserver tree while the markdown DOM is still settling.
  const toc = useMemo(
    () => (article?.content ? extractTOC(article.content) : []),
    [article?.content]
  );
  const readTime = article?.content ? estimateReadTime(article.content) : 0;
  const locale = languageLocale(currentLanguage);

  // Reading progress bar
  useEffect(() => {
    if (pageKind !== 'article') return undefined;

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        setReadProgress(Math.min((scrollTop / docHeight) * 100, 100));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pageKind]);

  // IntersectionObserver for active heading tracking
  useEffect(() => {
    if (toc.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveHeading(entry.target.id);
          }
        }
      },
      { rootMargin: '-80px 0px -75% 0px', threshold: 0 }
    );

    // Small delay to ensure DOM is ready after markdown render
    const timer = setTimeout(() => {
      toc.forEach(({ id }) => {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
      });
    }, 200);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [toc]);

  // Keep all hooks above route-mode branching. Next.js can reuse this page
  // component when navigating between language category and article routes.
  if (pageKind === 'category') {
    return (
      <CategoryPage
        siteConfig={siteConfig}
        categoryTree={categoryTree}
        categorySlug={categorySlug}
        articles={articles}
        categoryInfo={categoryInfo}
        currentLanguage={currentLanguage}
      />
    );
  }

  // 404 state
  if (router.isFallback || !article) {
    return (
      <Layout
        categoryTree={categoryTree}
        siteConfig={siteConfig}
        currentLanguage={currentLanguage}
      >
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-5 rounded-lg bg-white/[0.02] border border-white/[0.05] flex items-center justify-center">
              <FileText size={24} className="text-white/20" aria-hidden="true" />
            </div>
            <h1 className="text-lg text-white/50 mb-2 font-light">{copy.articleNotFound}</h1>
            <Link
              href={languagePathPrefix(currentLanguage) || '/'}
              className="text-sm text-primary hover:text-primary-300 transition-colors"
            >
              &larr; {copy.backToDocs}
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  // BUG FIX (v1.0.1): Use article's own category_slug for prev/next links
  const articleCatSlug = article.category_slug || categorySlug;
  const showSummary = Boolean(
    article.summary && !summaryRepeatsFirstParagraph(article.content, article.summary)
  );
  const docsBaseUrl = siteConfig?.docs_base_url || 'https://docs.aeronyx.network';
  const canonicalSlug = article.canonical_slug || article.translation_key || article.slug;
  const canonicalUrl = `${docsBaseUrl}${languagePathPrefix(currentLanguage)}/${articleCatSlug}/${canonicalSlug}`;
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: copy.docs,
        item: `${docsBaseUrl}${languagePathPrefix(currentLanguage) || '/'}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: article.category_name || articleCatSlug,
        item: `${docsBaseUrl}${languagePathPrefix(currentLanguage)}/${articleCatSlug}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: article.title,
        item: canonicalUrl,
      },
    ],
  };
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: article.title,
    description: article.meta_description || article.summary,
    inLanguage: currentLanguage,
    datePublished: article.published_at,
    dateModified: article.updated_at || article.published_at,
    author: {
      '@type': 'Organization',
      name: article.author_name || 'AeroNyx',
    },
    publisher: {
      '@type': 'Organization',
      name: 'AeroNyx',
      url: 'https://aeronyx.network',
    },
    mainEntityOfPage: canonicalUrl,
    url: canonicalUrl,
  };

  return (
    <Layout
      categoryTree={categoryTree}
      siteConfig={siteConfig}
      title={article.meta_title || article.title}
      description={article.meta_description || article.summary}
      currentLanguage={currentLanguage}
      meta={{
        keywords: article.meta_keywords,
        image: article.cover_image,
        canonical: canonicalUrl,
        type: 'article',
      }}
    >
      <Head>
        {SUPPORTED_LANGUAGES.map((language) => {
          return (
            <link
              key={language.code}
              rel="alternate"
              hrefLang={language.code}
              href={`${docsBaseUrl}${languagePathPrefix(language.code)}/${articleCatSlug}/${canonicalSlug}`}
            />
          );
        })}
        <link
          rel="alternate"
          hrefLang="x-default"
          href={`${docsBaseUrl}/${articleCatSlug}/${canonicalSlug}`}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
      </Head>

      {/* Reading progress bar */}
      <div
        className="reading-progress"
        style={{ width: `${readProgress}%` }}
        role="progressbar"
        aria-valuenow={Math.round(readProgress)}
        aria-valuemin={0}
        aria-valuemax={100}
      />

      <div className="flex">
        {/* ===== Article content ===== */}
        <article
          className="flex-1 min-w-0 max-w-3xl mx-auto px-5 sm:px-7 py-9 sm:py-10 lg:py-12"
        >
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-[11px] text-white/20 mb-8" aria-label="Breadcrumb">
            <Link
              href={languagePathPrefix(currentLanguage) || '/'}
              className="hover:text-white/50 transition-colors"
            >
              {copy.docs}
            </Link>
            <span className="text-white/10">/</span>
            {article.category_name && (
              <>
                <Link
                  href={`${languagePathPrefix(currentLanguage)}/${articleCatSlug}`}
                  className="hover:text-white/50 transition-colors"
                >
                  {article.category_name}
                </Link>
                <span className="text-white/10">/</span>
              </>
            )}
            <span className="text-white/35 truncate max-w-[200px]">{article.title}</span>
          </nav>

          {/* Cover image */}
          {article.cover_image && (
            <img
              src={article.cover_image}
              alt={article.title}
              className="w-full rounded-lg border border-white/[0.06] mb-8 max-h-72 object-cover"
              loading="eager"
            />
          )}

          {/* Title */}
          <h1 className="text-[1.75rem] sm:text-[2rem] lg:text-[2.25rem] font-semibold text-white/95 mb-5 leading-[1.2]">
            {article.title}
          </h1>

          {/* Meta info bar */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-white/25 mb-8 pb-6 border-b border-white/[0.05]">
            {article.author_name && (
              <span className="flex items-center gap-1.5">
                <User size={11} />
                {article.author_name}
              </span>
            )}
            {article.published_at && (
              <span className="flex items-center gap-1.5">
                <Clock size={11} />
                {new Date(article.published_at).toLocaleDateString(locale, {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </span>
            )}
            {readTime > 0 && (
              <span className="flex items-center gap-1.5">
                <BookOpen size={11} />
                {copy.minRead(readTime)}
              </span>
            )}
            {article.view_count > 0 && (
              <span className="flex items-center gap-1.5">
                <Eye size={11} />
                {copy.views(article.view_count)}
              </span>
            )}
          </div>

          {/* Summary callout */}
          {showSummary && (
            <div className="border-l-2 border-primary/60 pl-4 mb-8">
              <p className="text-[14px] text-white/50 leading-[1.75]">
                {article.summary}
              </p>
            </div>
          )}

          {/* ===== Markdown content ===== */}
          <MarkdownRenderer content={article.content} />

          {/* ===== Prev / Next navigation ===== */}
          <nav className="mt-14 pt-8 border-t border-white/[0.05]" aria-label="Article navigation">
            <div className="grid sm:grid-cols-2 gap-3">
              {article.prev_article ? (
                <Link
                  href={articleHref(article.prev_article, currentLanguage, articleCatSlug)}
                  className="group flex items-center gap-3 p-4 rounded-lg
                    border border-white/[0.04] hover:border-white/[0.1] hover:bg-white/[0.02]
                    transition-all duration-200"
                >
                  <ChevronLeft
                    size={16}
                    className="text-white/15 group-hover:text-primary/60 transition-colors flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-widest text-white/20 mb-1">
                      {copy.previous}
                    </div>
                    <div className="text-[13px] text-white/50 group-hover:text-white/75 truncate transition-colors">
                      {article.prev_article.title}
                    </div>
                  </div>
                </Link>
              ) : (
                <div />
              )}

              {article.next_article ? (
                <Link
                  href={articleHref(article.next_article, currentLanguage, articleCatSlug)}
                  className="group flex items-center justify-end gap-3 p-4 rounded-lg
                    border border-white/[0.04] hover:border-white/[0.1] hover:bg-white/[0.02]
                    transition-all duration-200 text-right"
                >
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-widest text-white/20 mb-1">
                      {copy.next}
                    </div>
                    <div className="text-[13px] text-white/50 group-hover:text-white/75 truncate transition-colors">
                      {article.next_article.title}
                    </div>
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-white/15 group-hover:text-primary/60 transition-colors flex-shrink-0"
                  />
                </Link>
              ) : (
                <div />
              )}
            </div>
          </nav>
        </article>

        {/* ===== Right sidebar: Table of Contents (desktop only) ===== */}
        {toc.length > 0 && (
          <aside className="hidden xl:block w-52 flex-shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto py-10 pr-6">
            <div className="text-[10px] uppercase tracking-[0.1em] text-white/20 mb-4 font-medium">
              {copy.onThisPage}
            </div>
            <nav className="space-y-0.5" aria-label="Table of contents">
              {toc.map(({ level, text, id }) => (
                <a
                  key={id}
                  href={`#${id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`
                    block text-[12px] leading-relaxed transition-all duration-150 py-[3px] rounded-sm
                    ${level === 3 ? 'pl-3' : level === 4 ? 'pl-6' : ''}
                    ${
                      activeHeading === id
                        ? 'text-primary font-medium translate-x-0.5'
                        : 'text-white/20 hover:text-white/45'
                    }
                  `}
                >
                  {text}
                </a>
              ))}
            </nav>
          </aside>
        )}
      </div>
    </Layout>
  );
}

// ============================================
// Data Fetching
// ============================================

export async function getArticlePageProps(context, lang = DEFAULT_LANGUAGE) {
  const { category: categorySlug, slug } = context.params;
  const isLanguageCategory = SUPPORTED_LANGUAGES.some((language) => language.code === categorySlug);

  if (isLanguageCategory) {
    const categoryProps = await getCategoryPageProps(
      { params: { category: slug } },
      normalizeLanguage(categorySlug)
    );
    return {
      ...categoryProps,
      props: {
        ...categoryProps.props,
        pageKind: 'category',
      },
    };
  }

  const [siteConfig, categoryTree, article] = await Promise.all([
    fetchSiteConfig(),
    fetchCategoryTree({ lang }),
    fetchArticleBySlug(slug, { lang }),
  ]);

  if (!article) {
    return { notFound: true };
  }

  return {
    props: {
      categoryTree: categoryTree || [],
      siteConfig: siteConfig || null,
      article,
      categorySlug,
      currentLanguage: lang,
    },
  };
}

export async function getServerSideProps(context) {
  return getArticlePageProps(context, DEFAULT_LANGUAGE);
}
