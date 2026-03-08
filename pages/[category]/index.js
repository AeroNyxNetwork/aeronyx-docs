/**
 * ============================================
 * File: docs-frontend/pages/[category]/index.js
 * ============================================
 * Creation Reason: Category page showing article list for a given category
 * Modification Reason: v1.0.1 - Added file path in header, improved loading
 *   state, better empty state design, article count in header
 *
 * Main Logical Flow:
 *   1. Fetch category tree and articles for this category slug
 *   2. Find category metadata from tree
 *   3. Render article list or empty state
 *
 * Dependencies:
 *   - lib/api.js (fetchCategoryTree, fetchArticleList)
 *   - components/Layout.js
 *   - next/link, next/router
 *   - lucide-react (icons)
 *
 * ⚠️ Important Note for Next Developer:
 * - If category slug doesn't match any category, shows empty state
 * - getServerSideProps ensures fresh data on each request
 * - Articles are pre-filtered to is_published=true by the API
 *
 * Last Modified: v1.0.1 - Visual polish + empty state
 * ============================================
 */

import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, Eye } from 'lucide-react';
import Layout from '../../components/Layout';
import { fetchCategoryTree, fetchArticleList } from '../../lib/api';

export default function CategoryPage({ categoryTree, categorySlug, articles, categoryInfo }) {
  const router = useRouter();

  if (router.isFallback) {
    return (
      <Layout categoryTree={categoryTree}>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-white/20 text-sm">Loading...</div>
        </div>
      </Layout>
    );
  }

  const title = categoryInfo?.name || categorySlug;
  const count = articles?.length || 0;

  return (
    <Layout
      categoryTree={categoryTree}
      title={title}
      description={categoryInfo?.description || `Articles in ${title}`}
    >
      <div className="max-w-4xl mx-auto px-6 py-10 lg:py-12">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[11px] text-white/20 mb-6">
          <Link href="/" className="hover:text-white/50 transition-colors">Docs</Link>
          <span>/</span>
          <span className="text-white/40">{title}</span>
        </div>

        {/* Category header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl sm:text-3xl font-light text-white/90">{title}</h1>
            {count > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-[10px] text-white/25 tabular-nums">
                {count}
              </span>
            )}
          </div>
          {categoryInfo?.description && (
            <p className="text-[14px] text-white/35 max-w-2xl leading-relaxed">
              {categoryInfo.description}
            </p>
          )}
        </motion.div>

        {/* Article list */}
        {articles && articles.length > 0 ? (
          <div className="space-y-2">
            {articles.map((article, i) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
              >
                <Link
                  href={`/${categorySlug}/${article.slug}`}
                  className="group flex items-center justify-between p-4 rounded-xl
                    border border-white/[0.04] bg-white/[0.01]
                    hover:bg-white/[0.03] hover:border-white/[0.08]
                    transition-all duration-200"
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[14px] font-medium text-white/75 group-hover:text-white transition-colors">
                      {article.title}
                    </h3>
                    {article.summary && (
                      <p className="text-[13px] text-white/25 truncate mt-1">
                        {article.summary}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-white/15">
                      {article.published_at && (
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {new Date(article.published_at).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric',
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
                  </div>
                  <ArrowRight
                    size={15}
                    className="flex-shrink-0 ml-4 text-white/[0.06] group-hover:text-primary/50 group-hover:translate-x-0.5 transition-all"
                  />
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center">
              <span className="text-xl opacity-40">📭</span>
            </div>
            <p className="text-sm text-white/25">No articles in this category yet.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}

// ============================================
// Data Fetching
// ============================================

export async function getServerSideProps(context) {
  const { category: categorySlug } = context.params;

  const [categoryTree, articleData] = await Promise.all([
    fetchCategoryTree(),
    fetchArticleList({ category: categorySlug }),
  ]);

  // Find category info from tree (recursive search)
  let categoryInfo = null;
  const findCategory = (tree, slug) => {
    for (const cat of tree) {
      if (cat.slug === slug) return cat;
      if (cat.children) {
        const found = findCategory(cat.children, slug);
        if (found) return found;
      }
    }
    return null;
  };

  if (categoryTree) {
    categoryInfo = findCategory(categoryTree, categorySlug);
  }

  let articles = [];
  if (articleData) {
    const raw = articleData.results || articleData;
    if (Array.isArray(raw)) articles = raw;
  }

  return {
    props: {
      categoryTree: categoryTree || [],
      categorySlug,
      articles,
      categoryInfo: categoryInfo
        ? { name: categoryInfo.name, description: categoryInfo.description || '' }
        : null,
    },
  };
}
