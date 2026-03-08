/**
 * ============================================
 * File: docs-frontend/pages/index.js
 * ============================================
 * Creation Reason: Documentation homepage / landing page
 * Modification Reason: v1.0.1 - Enhanced visual design with brand gradient
 *   hero section, improved card hover effects, better empty state,
 *   added subtle grid pattern background for "wow factor"
 *
 * Main Logical Flow:
 *   1. getServerSideProps fetches categoryTree + recent articles
 *   2. Renders hero section with brand gradient + intro text
 *   3. Shows recent articles as feature cards
 *   4. Shows category grid for browsing
 *
 * Dependencies:
 *   - lib/api.js (fetchCategoryTree, fetchArticleList)
 *   - components/Layout.js
 *   - framer-motion (entrance animations)
 *   - lucide-react (icons)
 *
 * ⚠️ Important Note for Next Developer:
 * - Article cards link to /[category_slug]/[article_slug]
 * - Category cards link to first article or category index
 * - getServerSideProps handles both paginated & raw API responses
 *
 * Last Modified: v1.0.1 - Visual upgrade + better data handling
 * ============================================
 */

import Link from 'next/link';
import { motion } from 'framer-motion';
import { BookOpen, ArrowRight, Clock, Eye, Search } from 'lucide-react';
import Layout from '../components/Layout';
import { fetchCategoryTree, fetchArticleList } from '../lib/api';

export default function DocsHome({ categoryTree, recentArticles }) {
  return (
    <Layout categoryTree={categoryTree} title="AeroNyx Docs">
      <div className="max-w-4xl mx-auto px-6 py-10 lg:py-14">

        {/* ===== Hero Section ===== */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative mb-16 p-8 sm:p-10 rounded-2xl overflow-hidden"
        >
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.06] via-transparent to-primary/[0.03] rounded-2xl" />
          <div className="absolute inset-0 border border-white/[0.04] rounded-2xl" />

          {/* Subtle grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '32px 32px',
            }}
          />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/[0.08] border border-primary/[0.12] mb-6">
              <BookOpen size={13} className="text-primary" />
              <span className="text-[11px] font-medium text-primary-300 tracking-wide">
                Documentation &amp; Blog
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-light mb-4 text-white/95 leading-[1.15]">
              AeroNyx{' '}
              <span className="font-semibold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                Documentation
              </span>
            </h1>

            <p className="text-[15px] sm:text-base text-white/40 max-w-xl leading-relaxed">
              Everything you need to understand, deploy, and build with AeroNyx Network.
              From getting started guides to deep technical references.
            </p>
          </div>
        </motion.div>

        {/* ===== Recent Articles ===== */}
        {recentArticles && recentArticles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-16"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-medium text-white/40 uppercase tracking-wider">
                Recent Articles
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {recentArticles.map((article, i) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 + i * 0.05 }}
                >
                  <ArticleCard article={article} />
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
              Browse by Category
            </h2>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {categoryTree.map((cat, i) => (
                <motion.div
                  key={cat.id || cat.slug}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.25 + i * 0.05 }}
                >
                  <CategoryCard category={cat} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ===== Empty state ===== */}
        {(!categoryTree || categoryTree.length === 0) &&
         (!recentArticles || recentArticles.length === 0) && (
          <div className="text-center py-24">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
              <Search size={24} className="text-white/15" />
            </div>
            <h2 className="text-lg text-white/50 mb-2 font-light">
              Documentation coming soon
            </h2>
            <p className="text-sm text-white/20 max-w-sm mx-auto">
              We&apos;re building out our docs. Check back soon or visit the main site.
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

function ArticleCard({ article }) {
  const catSlug = article.category_slug || 'uncategorized';
  const href = `/${catSlug}/${article.slug}`;

  return (
    <Link
      href={href}
      className="group block p-5 rounded-xl border border-white/[0.05] bg-white/[0.015]
        hover:bg-white/[0.035] hover:border-white/[0.1]
        transition-all duration-200"
    >
      {article.is_pinned && (
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/[0.08] border border-primary/[0.1] text-[10px] text-primary-300 font-medium mb-2.5 tracking-wide">
          Featured
        </div>
      )}
      <h3 className="text-[14px] font-medium text-white/80 group-hover:text-white mb-2 transition-colors leading-snug">
        {article.title}
      </h3>
      {article.summary && (
        <p className="text-[13px] text-white/30 line-clamp-2 mb-3 leading-relaxed">
          {article.summary}
        </p>
      )}
      <div className="flex items-center gap-3 text-[11px] text-white/20">
        {article.category_name && (
          <span className="text-primary/40">{article.category_name}</span>
        )}
        {article.published_at && (
          <span className="flex items-center gap-1">
            <Clock size={10} />
            {new Date(article.published_at).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
            })}
          </span>
        )}
        {article.view_count > 0 && (
          <span className="flex items-center gap-1">
            <Eye size={10} />
            {article.view_count}
          </span>
        )}
      </div>
    </Link>
  );
}

function CategoryCard({ category }) {
  const firstArticle = category.articles?.[0];
  const href = firstArticle
    ? `/${category.slug}/${firstArticle.slug}`
    : `/${category.slug}`;

  const iconMap = {
    book: '📖', folder: '📁', code: '💻', rocket: '🚀',
    shield: '🛡️', brain: '🧠', globe: '🌐', key: '🔑',
    api: '⚡', guide: '📘', faq: '❓', changelog: '📋',
  };
  const icon = iconMap[category.icon] || '📄';
  const count = category.article_count || category.articles?.length || 0;

  return (
    <Link
      href={href}
      className="group block p-5 rounded-xl border border-white/[0.05] bg-white/[0.015]
        hover:bg-primary/[0.03] hover:border-primary/[0.12]
        transition-all duration-200"
    >
      <div className="flex items-center gap-3 mb-2.5">
        <span className="text-lg">{icon}</span>
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
          {count} article{count !== 1 ? 's' : ''}
        </span>
        <ArrowRight
          size={13}
          className="text-white/[0.06] group-hover:text-primary/50 group-hover:translate-x-0.5 transition-all"
        />
      </div>
    </Link>
  );
}

// ============================================
// Data Fetching
// ============================================

export async function getServerSideProps() {
  const [categoryTree, articleData] = await Promise.all([
    fetchCategoryTree(),
    fetchArticleList(),
  ]);

  // Handle paginated response ({ results, count, ... }) or raw array
  let recentArticles = [];
  if (articleData) {
    const raw = articleData.results || articleData;
    if (Array.isArray(raw)) {
      recentArticles = raw.slice(0, 6);
    }
  }

  return {
    props: {
      categoryTree: categoryTree || [],
      recentArticles,
    },
  };
}
