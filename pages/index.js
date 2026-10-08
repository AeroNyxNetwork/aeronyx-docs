/**
 * ============================================
 * File: docs-frontend/pages/index.js
 * ============================================
 * Creation Reason: Documentation homepage / landing page
 * Modification Reason:
 *   v1.3.0 - [DOCS-NAVIGATION 2026-10-08 by Codex] Expose the chat guide
 *     in every available language and align home cards with reader sections.
 *   v1.2.1 - [DOCS-HOME-SEO-I18N 2026-10-07 by Codex] Add language
 *     alternates and concise translated fallbacks without overriding CMS copy.
 *   v1.2.0 - [DOCS-UX 2026-08-04 by Codex] Replace the blog-style gradient
 *     hero, emoji categories, and popularity metadata with a quiet official
 *     reading path and direct category navigation.
 *   v1.1.1 - Add canonical homepage metadata and localize article card dates
 *     and view counters for multilingual home routes.
 *   v1.1.0 - Read homepage hero, SEO, and empty-state copy from Django
 *     docs SiteConfig for GEO/admin control.
 *   v1.0.1 - Enhanced visual design with brand gradient
 *   hero section, improved card hover effects, better empty state,
 *   added subtle grid pattern background for "wow factor"
 *
 * Main Logical Flow:
 *   1. getServerSideProps fetches siteConfig + categoryTree + recent articles
 *   2. Renders an unframed protocol introduction and two canonical entry links
 *   3. Shows the ordered recommended reading path
 *   4. Shows compact category navigation for the complete documentation set
 *
 * Dependencies:
 *   - lib/api.js (fetchSiteConfig, fetchCategoryTree, fetchArticleList)
 *   - components/Layout.js
 *   - framer-motion (entrance animations)
 *   - lucide-react (icons)
 *
 * ⚠️ Important Note for Next Developer:
 * - Article cards link to /[category_slug]/[article_slug]
 * - Category cards link to first article or category index
 * - getServerSideProps handles both paginated & raw API responses
 *
 * Last Modified: v1.3.0 - First-class localized developer integration entry
 * ============================================
 */

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Braces,
  CircleHelp,
  Compass,
  FileText,
  KeyRound,
  Network,
  Search,
  Server,
  ShieldCheck,
} from 'lucide-react';
import Layout from '../components/Layout';
import {
  articleHref,
  DEFAULT_LANGUAGE,
  documentationAlternates,
  fetchSiteConfig,
  fetchCategoryTree,
  fetchArticleList,
  getUiCopy,
  languagePathPrefix,
  navigationArticleContext,
  navigationArticles,
  findNavigationCategory,
  navigationCategoryName,
} from '../lib/api';

export default function DocsHome({
  siteConfig,
  categoryTree,
  developerChatArticle,
  recentArticles,
  currentLanguage = DEFAULT_LANGUAGE,
}) {
  const copy = getUiCopy(currentLanguage);
  const docsBaseUrl = (siteConfig?.docs_base_url || 'https://docs.aeronyx.network').replace(/\/+$/, '');
  const canonicalUrl = `${docsBaseUrl}${languagePathPrefix(currentLanguage) || '/'}`;
  const primaryArticle = recentArticles?.find(
    (article) => (article.translation_key || article.slug) === 'what-is-aeronyx'
  );
  const memChainArticle = recentArticles?.find(
    (article) => (article.translation_key || article.slug) === 'memory-chain-and-encrypted-storage'
  );
  // [DOCS-NAVIGATION 2026-10-08 by Codex] The integration guide is a
  // first-class destination, independent of the time-ordered article grid.

  return (
    <Layout
      categoryTree={categoryTree}
      siteConfig={siteConfig}
      title={siteConfig?.seo_title || copy.protocolDocumentation}
      description={siteConfig?.seo_description || copy.documentationDescription}
      meta={{
        keywords: siteConfig?.seo_keywords,
        canonical: canonicalUrl,
        alternates: documentationAlternates('/', docsBaseUrl),
      }}
      currentLanguage={currentLanguage}
    >
      <div className="max-w-5xl mx-auto px-5 sm:px-7 py-10 sm:py-14 lg:py-16">

        {/* ===== Hero Section ===== */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-16 sm:mb-20 max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 mb-6 text-[11px] font-medium text-white/45 tracking-wider uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
            {siteConfig?.badge_label || copy.officialDocumentation}
          </div>

          <h1 className="text-[2.15rem] sm:text-[3rem] lg:text-[3.5rem] font-semibold mb-5 text-white/95 leading-[1.08]">
            {siteConfig?.hero_title || 'AeroNyx'}{' '}
            <span className="text-white/45">
              {siteConfig?.hero_highlight || copy.protocolDocumentation}
            </span>
          </h1>

          <p className="text-[15px] sm:text-[17px] text-white/45 max-w-2xl leading-[1.75]">
            {siteConfig?.hero_description ||
              copy.documentationDescription}
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 mt-8">
            {primaryArticle && (
              <Link
                href={articleHref(primaryArticle, currentLanguage)}
                className="group inline-flex items-center gap-2 text-sm font-medium text-white/85 hover:text-white transition-colors"
              >
                {primaryArticle.title}
                <ArrowRight size={14} className="text-primary group-hover:translate-x-0.5 transition-transform" />
              </Link>
            )}
            {memChainArticle && (
              <Link
                href={articleHref(memChainArticle, currentLanguage)}
                className="group inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors"
              >
                {memChainArticle.title}
                <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            )}
          </div>
        </motion.section>

        {/* ===== Developer integration ===== */}
        {developerChatArticle && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="mb-16 border-y border-primary/20 bg-primary/[0.035] sm:mb-20"
          >
            <Link
              href={articleHref(developerChatArticle, currentLanguage)}
              className="group grid gap-5 px-1 py-7 sm:grid-cols-[auto_1fr_auto] sm:items-center"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-primary/20 bg-primary/[0.08] text-primary">
                <KeyRound size={20} aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-primary-300">
                  {navigationCategoryName('developers', currentLanguage)}
                </span>
                <span className="block text-lg font-medium text-white/90 transition-colors group-hover:text-white">
                  {developerChatArticle.title}
                </span>
                {developerChatArticle.summary && (
                  <span className="mt-2 block max-w-2xl text-[13px] leading-relaxed text-white/40">
                    {developerChatArticle.summary}
                  </span>
                )}
              </span>
              <span className="inline-flex items-center gap-2 text-sm font-medium text-primary-300">
                {copy.open}
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </motion.section>
        )}

        {/* ===== Recent Articles ===== */}
        {recentArticles && recentArticles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-16 sm:mb-20"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-medium text-white/40 uppercase tracking-wider">
                {copy.recentArticles}
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-px overflow-hidden rounded-lg border border-white/[0.07] bg-white/[0.07]">
              {recentArticles.map((article, i) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 + i * 0.05 }}
                >
                  <ArticleCard article={article} categoryTree={categoryTree} currentLanguage={currentLanguage} index={i} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ===== Category Overview ===== */}
        {categoryTree && categoryTree.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-6">
              {copy.browseByCategory}
            </h2>

            <div className="grid sm:grid-cols-2 gap-3">
              {categoryTree.map((cat, i) => (
                <motion.div
                  key={cat.id || cat.slug}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.25 + i * 0.05 }}
                >
                  <CategoryCard category={cat} currentLanguage={currentLanguage} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ===== Empty state ===== */}
        {(!categoryTree || categoryTree.length === 0) &&
         (!recentArticles || recentArticles.length === 0) && (
          <div className="text-center py-24">
            <div className="w-16 h-16 mx-auto mb-5 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
              <Search size={24} className="text-white/15" />
            </div>
            <h2 className="text-lg text-white/50 mb-2 font-light">
              {siteConfig?.empty_state_title || copy.documentationComingSoon}
            </h2>
            <p className="text-sm text-white/20 max-w-sm mx-auto">
              {siteConfig?.empty_state_description || copy.buildingDocs}
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}

// ============================================
// Sub-components
// ============================================

function ArticleCard({ article, categoryTree, currentLanguage, index }) {
  const sectionName = navigationArticleContext(categoryTree, article)?.section.name || article.category_name;
  const href = articleHref(article, currentLanguage);

  return (
    <Link
      href={href}
      className="group block min-h-[154px] p-5 sm:p-6 bg-[#0b0b0e]
        hover:bg-[#101014] transition-colors duration-200"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] text-white/20 font-mono tabular-nums">
          {String(index + 1).padStart(2, '0')}
        </span>
        {sectionName && (
          <span className="text-[10px] text-primary/60 uppercase tracking-wider">
            {sectionName}
          </span>
        )}
      </div>
      <h3 className="text-[15px] font-medium text-white/80 group-hover:text-white mb-2 transition-colors leading-snug">
        {article.title}
      </h3>
      {article.summary && (
        <p className="text-[13px] text-white/35 line-clamp-2 leading-relaxed">
          {article.summary}
        </p>
      )}
    </Link>
  );
}

function CategoryCard({ category, currentLanguage }) {
  const copy = getUiCopy(currentLanguage);
  const href = `${languagePathPrefix(currentLanguage)}/${category.slug}`;
  const iconMap = {
    intro: Compass,
    developers: Braces,
    'node-operators': Server,
    network: Network,
    faq: CircleHelp,
    articles: ShieldCheck,
  };
  const CategoryIcon = iconMap[category.slug] || FileText;
  const count = category.article_count || category.articles?.length || 0;

  return (
    <Link
      href={href}
      className="group block p-5 rounded-lg border border-white/[0.06] bg-white/[0.01]
        hover:bg-white/[0.025] hover:border-white/[0.12]
        transition-all duration-200"
    >
      <div className="flex items-center gap-3 mb-2.5">
        <CategoryIcon size={17} className="text-white/30 group-hover:text-primary/70 transition-colors" />
        <h3 className="text-[14px] font-medium text-white/75 group-hover:text-white transition-colors">
          {category.name}
        </h3>
      </div>
      {category.description && (
        <p className="text-[12px] text-white/25 line-clamp-2 mb-3 leading-relaxed">
          {category.description}
        </p>
      )}
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-white/15 tabular-nums">
          {copy.articleCount(count)}
        </span>
        <ArrowRight
          size={13}
          className="text-white/10 group-hover:text-primary/60 group-hover:translate-x-0.5 transition-all"
        />
      </div>
    </Link>
  );
}

// ============================================
// Data Fetching
// ============================================

export async function getDocsHomeProps(lang = DEFAULT_LANGUAGE) {
  const [siteConfig, categoryTree, articleData] = await Promise.all([
    fetchSiteConfig({ lang }),
    fetchCategoryTree({ lang }),
    fetchArticleList({ lang }),
  ]);

  // Handle paginated response ({ results, count, ... }) or raw array
  const raw = articleData?.results || articleData;
  const publishedArticles = Array.isArray(raw) ? raw : [];
  // [DOCS-NAVIGATION 2026-10-08 by Codex] Prefer the published guide in this
  // locale, not an untranslated English API. The tree keeps the entry usable
  // when the separate recent-article request fails or its first page changes.
  const developerArticles = navigationArticles(findNavigationCategory(categoryTree, 'developers'));
  const entry = developerArticles[0];
  const developerChatArticle = entry
    ? { ...publishedArticles.find((article) => article.id === entry.id), ...entry } : null;
  const recentArticles = publishedArticles
    .filter((article) => article.id !== developerChatArticle?.id)
    .slice(0, 6);

  return {
    props: {
      siteConfig: siteConfig || null,
      categoryTree: categoryTree || [],
      developerChatArticle,
      recentArticles,
      currentLanguage: lang,
    },
  };
}

export async function getServerSideProps() {
  return getDocsHomeProps(DEFAULT_LANGUAGE);
}
