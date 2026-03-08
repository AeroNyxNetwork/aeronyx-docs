/**
 * ============================================
 * File: docs-frontend/components/Sidebar.js
 * ============================================
 * Creation Reason: Tree-structured navigation for docs categories & articles
 * Modification Reason: v1.0.1 - Fixed expanded state not updating on route
 *   change (BUG: initial state was stale after navigation). Now uses useEffect
 *   to react to currentSlug changes. Improved mobile drawer animation.
 *
 * Main Functionality:
 *   - Renders category tree from API
 *   - Expandable/collapsible category groups
 *   - Active article highlight with left border accent
 *   - Mobile drawer mode with overlay backdrop
 *   - Auto-expands category containing current article
 *
 * Main Logical Flow:
 *   1. Receives categoryTree data from Layout (SSR prop)
 *   2. Renders recursive CategoryGroup components
 *   3. Highlights current article based on router slug
 *   4. On mobile, shows as slide-in overlay drawer
 *
 * Dependencies:
 *   - next/router (active state detection)
 *   - next/link (navigation)
 *   - lucide-react (icons)
 *
 * ⚠️ Important Note for Next Developer:
 * - categoryTree structure: [{ name, slug, icon, children, articles }]
 * - articles inside each category: [{ id, title, slug, sort_order }]
 * - Supports up to 3 nesting levels (visual indent)
 * - expanded state is synced with currentSlug via useEffect
 *
 * Last Modified: v1.0.1 - Route-aware expand + mobile animation fix
 * ============================================
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ChevronRight, FileText, X } from 'lucide-react';

// ============================================
// Helper: Check if a category subtree contains a given slug
// ============================================

function categoryContainsSlug(category, slug) {
  if (!slug) return false;
  if (category.articles?.some((a) => a.slug === slug)) return true;
  if (category.children?.some((child) => categoryContainsSlug(child, slug))) return true;
  return false;
}

// ============================================
// Main Sidebar Component
// ============================================

export default function Sidebar({ categoryTree = [], isOpen, onClose }) {
  const router = useRouter();
  const currentSlug = router.query.slug;

  // Close sidebar on route change (mobile)
  useEffect(() => {
    const handleRouteChange = () => onClose?.();
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => router.events.off('routeChangeComplete', handleRouteChange);
  }, [router, onClose]);

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed top-14 bottom-0 left-0 z-40
          w-[280px] bg-[#09090b] border-r border-white/[0.05]
          transform transition-transform duration-250 ease-out
          lg:translate-x-0 lg:sticky lg:top-14 lg:z-0 lg:h-[calc(100vh-3.5rem)]
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        role="navigation"
        aria-label="Documentation navigation"
      >
        {/* Mobile close button */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05] lg:hidden">
          <span className="text-[10px] font-medium text-white/30 uppercase tracking-widest">
            Navigation
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/5 transition-colors"
            aria-label="Close navigation"
          >
            <X size={16} className="text-white/30" />
          </button>
        </div>

        {/* Scrollable nav */}
        <nav className="sidebar-scroll overflow-y-auto h-full py-4 px-3">
          {categoryTree.length === 0 ? (
            <div className="px-3 py-12 text-center">
              <div className="text-white/15 text-sm">No categories yet</div>
            </div>
          ) : (
            <div className="space-y-0.5">
              {categoryTree.map((category) => (
                <CategoryGroup
                  key={category.id || category.slug}
                  category={category}
                  currentSlug={currentSlug}
                  depth={0}
                />
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-white/[0.04] px-2">
            <a
              href="https://aeronyx.network"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-white/15 hover:text-white/35 transition-colors"
            >
              &copy; {new Date().getFullYear()} AeroNyx Network
            </a>
          </div>
        </nav>
      </aside>
    </>
  );
}

// ============================================
// CategoryGroup — Recursive category with articles
// ============================================

function CategoryGroup({ category, currentSlug, depth = 0 }) {
  const hasArticles = category.articles && category.articles.length > 0;
  const hasChildren = category.children && category.children.length > 0;
  const hasContent = hasArticles || hasChildren;

  // BUG FIX (v1.0.1): Use useEffect to sync expanded state with route changes.
  // Previously, expanded was only set on initial mount and became stale.
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const shouldExpand =
      depth === 0 ||  // Top-level always expanded by default
      categoryContainsSlug(category, currentSlug);
    if (shouldExpand) setExpanded(true);
  }, [currentSlug, category, depth]);

  // Icon mapping
  const iconMap = {
    book: '📖', folder: '📁', code: '💻', rocket: '🚀',
    shield: '🛡️', brain: '🧠', globe: '🌐', key: '🔑',
    api: '⚡', guide: '📘', faq: '❓', changelog: '📋',
  };
  const displayIcon = iconMap[category.icon] || '📄';

  return (
    <div>
      {/* Category header */}
      <button
        onClick={() => hasContent && setExpanded(!expanded)}
        className={`
          w-full flex items-center gap-2 px-2.5 py-[7px] rounded-lg text-left
          hover:bg-white/[0.03] transition-colors group
          ${depth > 0 ? 'ml-2.5' : ''}
        `}
        aria-expanded={expanded}
      >
        {hasContent && (
          <ChevronRight
            size={12}
            className={`text-white/15 transition-transform duration-200 flex-shrink-0
              ${expanded ? 'rotate-90' : ''}
            `}
          />
        )}
        {!hasContent && <div className="w-3 flex-shrink-0" />}
        <span className="text-[13px] flex-shrink-0">{displayIcon}</span>
        <span className="text-[13px] font-medium text-white/50 group-hover:text-white/75 truncate transition-colors">
          {category.name}
        </span>
        {hasArticles && (
          <span className="ml-auto text-[10px] text-white/15 flex-shrink-0 tabular-nums">
            {category.articles.length}
          </span>
        )}
      </button>

      {/* Expanded content */}
      {expanded && hasContent && (
        <div className={`${depth > 0 ? 'ml-2.5' : ''}`}>
          {/* Child categories (recursive) */}
          {hasChildren &&
            category.children.map((child) => (
              <CategoryGroup
                key={child.id || child.slug}
                category={child}
                currentSlug={currentSlug}
                depth={depth + 1}
              />
            ))}

          {/* Articles in this category */}
          {hasArticles && (
            <div className="ml-[22px] space-y-px mt-0.5 mb-1">
              {category.articles.map((article) => (
                <ArticleLink
                  key={article.id || article.slug}
                  article={article}
                  categorySlug={category.slug}
                  isActive={article.slug === currentSlug}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// ArticleLink — Single article nav item
// ============================================

function ArticleLink({ article, categorySlug, isActive }) {
  return (
    <Link
      href={`/${categorySlug}/${article.slug}`}
      className={`
        flex items-center gap-2 px-2.5 py-[6px] rounded-md text-[13px] transition-all
        ${
          isActive
            ? 'bg-primary/[0.08] text-primary-300 border-l-[3px] border-primary -ml-[3px] pl-[13px] font-medium'
            : 'text-white/40 hover:text-white/65 hover:bg-white/[0.025]'
        }
      `}
      aria-current={isActive ? 'page' : undefined}
    >
      <FileText
        size={12}
        className={`flex-shrink-0 ${isActive ? 'text-primary/70' : 'text-white/15'}`}
      />
      <span className="truncate">{article.title}</span>
    </Link>
  );
}
