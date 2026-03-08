/**
 * ============================================
 * File: docs-frontend/pages/[category]/[slug].js
 * ============================================
 * Creation Reason: Article detail page with full Markdown rendering
 * Modification Reason: v1.0.1 - Added reading progress bar, fixed prev/next
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
 *   - lib/api.js (fetchArticleBySlug, fetchCategoryTree)
 *   - components/Layout.js, components/MarkdownRenderer.js
 *   - framer-motion (entrance animation)
 *   - lucide-react (icons)
 *
 * ⚠️ Important Note for Next Developer:
 * - TOC is extracted client-side from markdown headings
 * - Article views are incremented server-side by Django on each fetch
 * - prev_article / next_article come from ArticleDetailSerializer
 * - BUG FIX: prev/next links now use article.category_slug (from API)
 *   instead of the URL categorySlug param, since articles might change category
 *
 * Last Modified: v1.0.1 - Progress bar + link fix + reading time
 * ============================================
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { Clock, Eye, User, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import Layout from '../../components/Layout';
import MarkdownRenderer, { extractTOC } from '../../components/MarkdownRenderer';
import { fetchArticleBySlug, fetchCategoryTree } from '../../lib/api';

// ============================================
// Estimated reading time utility
// ============================================

function estimateReadTime(content) {
  if (!content) return 0;
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

// ============================================
// Main Component
// ============================================

export default function ArticlePage({ categoryTree, article, categorySlug }) {
  const router = useRouter();
  const [activeHeading, setActiveHeading] = useState('');
  const [readProgress, setReadProgress] = useState(0);

  // Extract TOC from markdown
  const toc = article?.content ? extractTOC(article.content) : [];
  const readTime = article?.content ? estimateReadTime(article.content) : 0;

  // Reading progress bar
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        setReadProgress(Math.min((scrollTop / docHeight) * 100, 100));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  // 404 state
  if (router.isFallback || !article) {
    return (
      <Layout categoryTree={categoryTree}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center">
              <span className="text-2xl opacity-30">📄</span>
            </div>
            <h1 className="text-lg text-white/50 mb-2 font-light">Article not found</h1>
            <Link href="/" className="text-sm text-primary hover:text-primary-300 transition-colors">
              &larr; Back to docs
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  // BUG FIX (v1.0.1): Use article's own category_slug for prev/next links
  const articleCatSlug = article.category_slug || categorySlug;

  return (
    <Layout
      categoryTree={categoryTree}
      title={article.meta_title || article.title}
      description={article.meta_description || article.summary}
      meta={{
        keywords: article.meta_keywords,
        image: article.cover_image,
      }}
    >
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
        <motion.article
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex-1 min-w-0 max-w-3xl mx-auto px-6 py-10 lg:py-12"
        >
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-[11px] text-white/20 mb-8" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white/50 transition-colors">Docs</Link>
            <span className="text-white/10">/</span>
            {article.category_name && (
              <>
                <Link
                  href={`/${articleCatSlug}`}
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
              className="w-full rounded-xl border border-white/[0.06] mb-8 max-h-72 object-cover"
              loading="eager"
            />
          )}

          {/* Title */}
          <h1 className="text-[1.75rem] sm:text-[2rem] lg:text-[2.25rem] font-semibold text-white/95 mb-5 leading-[1.2] tracking-tight">
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
                {new Date(article.published_at).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </span>
            )}
            {readTime > 0 && (
              <span className="flex items-center gap-1.5">
                <BookOpen size={11} />
                {readTime} min read
              </span>
            )}
            {article.view_count > 0 && (
              <span className="flex items-center gap-1.5">
                <Eye size={11} />
                {article.view_count.toLocaleString()} views
              </span>
            )}
          </div>

          {/* Summary callout */}
          {article.summary && (
            <div className="bg-primary/[0.03] border border-primary/[0.08] rounded-xl px-5 py-4 mb-8">
              <p className="text-[14px] text-white/50 leading-[1.7] italic">
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
                  href={`/${articleCatSlug}/${article.prev_article.slug}`}
                  className="group flex items-center gap-3 p-4 rounded-xl
                    border border-white/[0.04] hover:border-white/[0.1] hover:bg-white/[0.02]
                    transition-all duration-200"
                >
                  <ChevronLeft
                    size={16}
                    className="text-white/15 group-hover:text-primary/60 transition-colors flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-widest text-white/20 mb-1">
                      Previous
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
                  href={`/${articleCatSlug}/${article.next_article.slug}`}
                  className="group flex items-center justify-end gap-3 p-4 rounded-xl
                    border border-white/[0.04] hover:border-white/[0.1] hover:bg-white/[0.02]
                    transition-all duration-200 text-right"
                >
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-widest text-white/20 mb-1">
                      Next
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
        </motion.article>

        {/* ===== Right sidebar: Table of Contents (desktop only) ===== */}
        {toc.length > 0 && (
          <aside className="hidden xl:block w-52 flex-shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto py-10 pr-6">
            <div className="text-[10px] uppercase tracking-[0.1em] text-white/20 mb-4 font-medium">
              On this page
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

export async function getServerSideProps(context) {
  const { category: categorySlug, slug } = context.params;

  const [categoryTree, article] = await Promise.all([
    fetchCategoryTree(),
    fetchArticleBySlug(slug),
  ]);

  if (!article) {
    return { notFound: true };
  }

  return {
    props: {
      categoryTree: categoryTree || [],
      article,
      categorySlug,
    },
  };
}
