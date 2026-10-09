/**
 * ============================================
 * File: docs-frontend/pages/index.js
 * ============================================
 * Creation Reason: Documentation homepage / landing page
 * Modification Reason:
 *   v1.4.0 - [DOCS-POLISH 2026-10-09 by Claude] The home page is a map:
 *     three primary entry points (understand, build, run a node) with their
 *     articles, then the other sections. Removed entrance animations (the
 *     server-rendered page started at opacity 0) and the recommended-reading
 *     grid that repeated the same pages.
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
 *   1. getServerSideProps fetches siteConfig + the localized category tree
 *   2. Renders the hero from SiteConfig
 *   3. Shows three entry cards (intro, developers, node-operators), each
 *      listing its first articles in navigation order
 *   4. Shows the remaining sections as compact category cards
 *
 * Dependencies:
 *   - lib/api.js (fetchSiteConfig, fetchCategoryTree, navigation helpers)
 *   - components/Layout.js
 *   - lucide-react (icons)
 *
 * ⚠️ Important Note for Next Developer:
 * - Entry and category cards link to /[category_slug] and
 *   /[category_slug]/[article_slug]; ordering comes from the navigation tree
 * - getServerSideProps handles both paginated & raw API responses
 *
 * Last Modified: v1.4.0 - Static entry-point map, no entrance animations
 * ============================================
 */

import Link from 'next/link';
import {
  ArrowRight,
  Braces,
  CircleHelp,
  Compass,
  FileText,
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
  getUiCopy,
  languagePathPrefix,
  navigationArticles,
  findNavigationCategory,
} from '../lib/api';

export default function DocsHome({
  siteConfig,
  categoryTree,
  currentLanguage = DEFAULT_LANGUAGE,
}) {
  const copy = getUiCopy(currentLanguage);
  // [DOCS-POLISH 2026-10-09 by Claude] SiteConfig holds one English copy of
  // the hero and SEO text. Other locales use their translated UI copy, so a
  // Japanese or Arabic home page no longer opens with an English headline.
  const siteCopy = currentLanguage === DEFAULT_LANGUAGE ? siteConfig : null;
  const docsBaseUrl = (siteConfig?.docs_base_url || 'https://docs.aeronyx.network').replace(/\/+$/, '');
  const canonicalUrl = `${docsBaseUrl}${languagePathPrefix(currentLanguage) || '/'}`;
  // [DOCS-POLISH 2026-10-09 by Claude] The home page is a map, not a feed:
  // three primary entry points (understand, build, run a node) list their
  // own articles, and every other section follows. It replaces the hero
  // links, the developer banner and the "recommended reading" grid, which
  // repeated the same pages up to three times. Nothing animates in: content
  // is visible in the server-rendered HTML.
  const primary = PRIMARY_SECTIONS
    .map((slug) => findNavigationCategory(categoryTree, slug))
    .filter(Boolean);
  const secondary = (categoryTree || []).filter(
    (category) => !PRIMARY_SECTIONS.includes(category.slug)
  );

  return (
    <Layout
      categoryTree={categoryTree}
      siteConfig={siteConfig}
      title={siteCopy?.seo_title || copy.protocolDocumentation}
      description={siteCopy?.seo_description || copy.documentationDescription}
      meta={{
        keywords: siteCopy?.seo_keywords,
        canonical: canonicalUrl,
        alternates: documentationAlternates('/', docsBaseUrl),
      }}
      currentLanguage={currentLanguage}
    >
      <div className="max-w-5xl mx-auto px-5 sm:px-7 py-10 sm:py-14 lg:py-16">

        {/* ===== Hero ===== */}
        <section className="mb-12 sm:mb-16 max-w-3xl">
          <div className="inline-flex items-center gap-2 mb-6 text-[11px] font-medium text-white/45 tracking-wider uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
            {siteCopy?.badge_label || copy.officialDocumentation}
          </div>

          <h1 className="text-[2.15rem] sm:text-[3rem] lg:text-[3.5rem] font-semibold mb-5 text-white/95 leading-[1.08]">
            {siteConfig?.hero_title || 'AeroNyx'}{' '}
            <span className="text-white/45">
              {siteCopy?.hero_highlight || copy.protocolDocumentation}
            </span>
          </h1>

          <p className="text-[15px] sm:text-[17px] text-white/55 max-w-2xl leading-[1.75]">
            {siteCopy?.hero_description || copy.documentationDescription}
          </p>
        </section>

        {/* ===== Primary entry points ===== */}
        {primary.length > 0 && (
          <section className="mb-14 sm:mb-16 grid gap-4 lg:grid-cols-3">
            {primary.map((category) => (
              <EntryCard key={category.slug} category={category} currentLanguage={currentLanguage} />
            ))}
          </section>
        )}

        {/* ===== Everything else ===== */}
        {secondary.length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-5">
              {copy.browseByCategory}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {secondary.map((category) => (
                <CategoryCard key={category.id || category.slug} category={category} currentLanguage={currentLanguage} />
              ))}
            </div>
          </section>
        )}

        {/* ===== Empty state ===== */}
        {(!categoryTree || categoryTree.length === 0) && (
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

const PRIMARY_SECTIONS = ['intro', 'developers', 'node-operators'];
const SECTION_ICONS = {
  intro: Compass,
  developers: Braces,
  'node-operators': Server,
  network: Network,
  faq: CircleHelp,
  articles: ShieldCheck,
};
const ENTRY_ARTICLE_LIMIT = 4;

// ============================================
// Sub-components
// ============================================

function EntryCard({ category, currentLanguage }) {
  const copy = getUiCopy(currentLanguage);
  const Icon = SECTION_ICONS[category.slug] || FileText;
  const articles = navigationArticles(category);
  const sectionHref = `${languagePathPrefix(currentLanguage)}/${category.slug}`;

  return (
    <div className="flex flex-col rounded-lg border border-white/[0.08] bg-white/[0.015] p-5 sm:p-6">
      <Link href={sectionHref} className="group mb-4 block">
        <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-primary/20 bg-primary/[0.08] text-primary">
          <Icon size={18} aria-hidden="true" />
        </span>
        <h2 className="text-[17px] font-medium text-white/90 group-hover:text-white transition-colors">
          {category.name}
        </h2>
        {category.description && (
          <p className="mt-1.5 text-[13px] leading-relaxed text-white/45">{category.description}</p>
        )}
      </Link>
      <ul className="mb-4 space-y-1.5 border-t border-white/[0.06] pt-4">
        {articles.slice(0, ENTRY_ARTICLE_LIMIT).map((article) => (
          <li key={article.id || article.slug}>
            <Link
              href={articleHref(article, currentLanguage, category.slug)}
              className="block text-[13.5px] leading-snug text-white/70 hover:text-white transition-colors"
            >
              {article.title}
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href={sectionHref}
        className="group mt-auto inline-flex items-center gap-1.5 text-[12px] text-primary-300 hover:text-primary-200"
      >
        {copy.articleCount(articles.length)}
        <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </Link>
    </div>
  );
}

function CategoryCard({ category, currentLanguage }) {
  const copy = getUiCopy(currentLanguage);
  const href = `${languagePathPrefix(currentLanguage)}/${category.slug}`;
  const CategoryIcon = SECTION_ICONS[category.slug] || FileText;
  const count = category.article_count || category.articles?.length || 0;

  return (
    <Link
      href={href}
      className="group block p-5 rounded-lg border border-white/[0.06] bg-white/[0.01]
        hover:bg-white/[0.025] hover:border-white/[0.12]
        transition-all duration-200"
    >
      <div className="flex items-center gap-3 mb-2.5">
        <CategoryIcon size={17} className="text-white/45 group-hover:text-primary/70 transition-colors" />
        <h3 className="text-[14px] font-medium text-white/75 group-hover:text-white transition-colors">
          {category.name}
        </h3>
      </div>
      {category.description && (
        <p className="text-[12.5px] text-white/45 line-clamp-2 mb-3 leading-relaxed">
          {category.description}
        </p>
      )}
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-white/35 tabular-nums">
          {copy.articleCount(count)}
        </span>
        <ArrowRight
          size={13}
          className="text-white/25 group-hover:text-primary/70 group-hover:translate-x-0.5 transition-all"
        />
      </div>
    </Link>
  );
}

// ============================================
// Data Fetching
// ============================================

export async function getDocsHomeProps(lang = DEFAULT_LANGUAGE) {
  const [siteConfig, categoryTree] = await Promise.all([
    fetchSiteConfig({ lang }),
    fetchCategoryTree({ lang }),
  ]);

  return {
    props: {
      siteConfig: siteConfig || null,
      categoryTree: categoryTree || [],
      currentLanguage: lang,
    },
  };
}

export async function getServerSideProps() {
  return getDocsHomeProps(DEFAULT_LANGUAGE);
}
