/**
 * ============================================
 * File: docs-frontend/components/Sidebar.js
 * ============================================
 * Creation Reason: Tree-structured navigation for docs categories & articles
 * Modification Reason:
 *   v1.5.1 - [DOCS-NAV-DETAILS 2026-10-08 by Codex] Add section overview
 *     links, category active states and keyboard-safe mobile navigation.
 *   v1.5.0 - [DOCS-NAVIGATION 2026-10-08 by Codex] Match section reading
 *     order, retain original article routes, and identify each submenu.
 *   v1.4.2 - [DOCS-LOCALE-TRANSITION 2026-10-07 by Codex] Mirror mobile
 *     navigation and use logical spacing for right-to-left documents.
 *   v1.4.1 - [DOCS-NAV-ICONS 2026-10-07 by Codex] Match current API icon
 *     names while preserving legacy aliases and navigation destinations.
 *   v1.4.0 - [DOCS-NAV 2026-09-24 by Codex] Replace the fully expanded
 *     directory with a focused accordion, simplify article rows, remove the
 *     duplicate site footer link, and resolve localized article routes against
 *     their third path segment so the current chapter stays visible.
 *   v1.3.0 - [DOCS-UX 2026-08-04 by Codex] Replace platform-dependent emoji
 *     navigation with consistent Lucide icons and localize drawer chrome.
 *   v1.2.0 - Sidebar article links respect currentLanguage for multilingual SEO routes.
 *   v1.0.1 - Fixed expanded state not updating on route change (BUG:
 *     initial state was stale after navigation). Now uses useEffect to react
 *     to currentSlug changes. Improved mobile drawer animation.
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
 * Last Modified: v1.5.1 - Section overviews and keyboard-safe drawer
 * ============================================
 */

import { useState, useEffect, useRef, useId } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  BookOpenText,
  Braces,
  BrainCircuit,
  ChevronRight,
  CircleHelp,
  Compass,
  FileText,
  Folder,
  Gauge,
  KeyRound,
  ListChecks,
  Network,
  Rocket,
  Server,
  ShieldCheck,
  X,
} from 'lucide-react';
import {
  articleHref, DEFAULT_LANGUAGE, documentationRouteContext, findNavigationCategory,
  getUiCopy, languageDirection, languagePathPrefix, navigationOverviewLabel,
} from '../lib/api';

const CATEGORY_ICONS = {
  // [DOCS-NAV-ICONS 2026-10-07 by Codex] Accept current API icon names
  // alongside legacy aliases; category URLs and ordering stay unchanged.
  compass: Compass,
  'layout-dashboard': Gauge,
  network: Network,
  'code-2': Braces,
  'circle-help': CircleHelp,
  'shield-check': ShieldCheck,
  book: BookOpenText,
  folder: Folder,
  code: Braces,
  rocket: Rocket,
  shield: ShieldCheck,
  brain: BrainCircuit,
  globe: Network,
  key: KeyRound,
  api: Braces,
  guide: Compass,
  faq: CircleHelp,
  changelog: ListChecks,
  server: Server,
  dashboard: Gauge,
};

// ============================================
// Helper: Check if a category subtree contains a given slug
// ============================================

function categoryContainsSlug(category, slug) {
  if (!slug) return false;
  if (category.articles?.some((a) => a.slug === slug || a.translation_key === slug)) return true;
  if (category.children?.some((child) => categoryContainsSlug(child, slug))) return true;
  return false;
}

// ============================================
// Main Sidebar Component
// ============================================

export default function Sidebar({
  categoryTree = [],
  isOpen,
  onClose,
  currentLanguage = DEFAULT_LANGUAGE,
}) {
  const router = useRouter();
  const { articleSlug: currentSlug, categorySlug: currentCategorySlug } = documentationRouteContext(router.query);
  const panelRef = useRef(null);
  const closeButtonRef = useRef(null);
  const copy = getUiCopy(currentLanguage);
  // [DOCS-LOCALE-TRANSITION 2026-10-07 by Codex] Mirror the drawer for RTL.
  const isRtl = languageDirection(currentLanguage) === 'rtl';
  const hiddenTranslation = isRtl ? 'translate-x-full' : '-translate-x-full';
  const activeTopLevelSlug = categoryTree.find((category) =>
    currentSlug ? categoryContainsSlug(category, currentSlug)
      : Boolean(findNavigationCategory([category], currentCategorySlug))
  )?.slug;
  const [expandedTopLevelSlug, setExpandedTopLevelSlug] = useState(
    activeTopLevelSlug || null
  );

  // Keep the reader's current chapter visible after client-side navigation.
  // [DOCS-NAV-DETAILS 2026-10-08 by Codex] Category indexes are chapters too.
  useEffect(() => {
    if (activeTopLevelSlug) setExpandedTopLevelSlug(activeTopLevelSlug);
  }, [activeTopLevelSlug, currentSlug, currentCategorySlug]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    const handleRouteChange = () => onClose?.();
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => router.events.off('routeChangeComplete', handleRouteChange);
  }, [router, onClose]);

  // [DOCS-NAV-DETAILS 2026-10-08 by Codex] Keep keyboard focus inside the
  // open mobile drawer and restore the trigger when it closes. CSS visibility
  // removes the closed drawer from keyboard/accessibility navigation.
  useEffect(() => {
    if (!isOpen) return;
    const desktop = window.matchMedia('(min-width: 1024px)');
    if (desktop.matches) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    const closeOnDesktop = () => { if (desktop.matches) onClose?.(); };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose?.();
      } else if (event.key === 'Tab') {
        const links = [...(panelRef.current?.querySelectorAll('a[href], button:not([disabled])') || [])]
          .filter((element) => element.getClientRects().length > 0);
        const first = links[0];
        const last = links[links.length - 1];
        const outside = !panelRef.current?.contains(document.activeElement);
        if (first && (outside || (event.shiftKey ? document.activeElement === first : document.activeElement === last))) {
          event.preventDefault();
          (event.shiftKey ? last : first).focus();
        }
      }
    };
    desktop.addEventListener('change', closeOnDesktop);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      desktop.removeEventListener('change', closeOnDesktop);
      document.removeEventListener('keydown', handleKeyDown);
      if (previousFocus?.isConnected && previousFocus.getClientRects().length > 0) previousFocus.focus();
    };
  }, [isOpen, onClose]);

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
        ref={panelRef}
        className={`
          fixed top-14 bottom-0 start-0 z-40 flex flex-col
          w-[280px] max-w-full bg-[#09090b] border-e border-white/[0.05]
          transform transition-transform duration-250 ease-out
          lg:translate-x-0 lg:sticky lg:top-14 lg:z-0 lg:h-[calc(100vh-3.5rem)]
          ${isOpen ? 'translate-x-0 visible' : `${hiddenTranslation} invisible lg:visible`}
        `}
        role="navigation"
        aria-label={copy.navigation}
      >
        {/* Mobile close button */}
        <div className="flex shrink-0 items-center justify-between px-4 py-3 border-b border-white/[0.05] lg:hidden">
          <span className="text-[10px] font-medium text-white/30 uppercase tracking-widest">
            {copy.navigation}
          </span>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary transition-colors"
            aria-label={copy.close}
          >
            <X size={16} className="text-white/30" />
          </button>
        </div>

        {/* Scrollable nav */}
        <nav className="sidebar-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain py-4 px-3">
          {categoryTree.length === 0 ? (
            <div className="px-3 py-12 text-center">
              <div className="text-white/20 text-sm leading-relaxed">{copy.noCategories}</div>
            </div>
          ) : (
            <div className="space-y-1">
              {categoryTree.map((category) => (
                <CategoryGroup
                  key={category.id || category.slug}
                  category={category}
                  currentSlug={currentSlug}
                  currentCategorySlug={currentCategorySlug}
                  currentLanguage={currentLanguage}
                  depth={0}
                  expandedOverride={expandedTopLevelSlug === category.slug}
                  onToggle={() =>
                    setExpandedTopLevelSlug((current) =>
                      current === category.slug ? null : category.slug
                    )
                  }
                />
              ))}
            </div>
          )}
        </nav>
      </aside>
    </>
  );
}

// ============================================
// CategoryGroup — Recursive category with articles
// ============================================

function CategoryGroup({
  category,
  currentSlug,
  currentCategorySlug,
  currentLanguage = DEFAULT_LANGUAGE,
  depth = 0,
  expandedOverride,
  onToggle,
}) {
  const hasArticles = category.articles && category.articles.length > 0;
  const hasChildren = category.children && category.children.length > 0;
  const hasContent = hasArticles || hasChildren;
  const groupId = `docs-group-${useId()}`;

  // BUG FIX (v1.0.1): Use useEffect to sync expanded state with route changes.
  // Previously, expanded was only set on initial mount and became stale.
  const [localExpanded, setLocalExpanded] = useState(false);
  const isControlled = typeof expandedOverride === 'boolean';
  const expanded = isControlled ? expandedOverride : localExpanded;
  const isCurrentCategory = !currentSlug && category.slug === currentCategorySlug;
  const isCurrentSection = currentSlug ? categoryContainsSlug(category, currentSlug)
    : Boolean(findNavigationCategory([category], currentCategorySlug));

  useEffect(() => {
    if (!isControlled && isCurrentSection) setLocalExpanded(true);
  }, [isControlled, isCurrentSection, currentSlug, currentCategorySlug]);

  const handleToggle = () => {
    if (!hasContent) return;
    if (isControlled) {
      onToggle?.();
      return;
    }
    setLocalExpanded((current) => !current);
  };

  const CategoryIcon = CATEGORY_ICONS[category.icon] || FileText;
  const isRtl = languageDirection(currentLanguage) === 'rtl';
  const chevronRotation = expanded ? 'rotate-90' : isRtl ? 'rotate-180' : '';

  return (
    <div>
      {/* Category header */}
      <button
        type="button"
        onClick={handleToggle}
        className={`
          w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-start
          hover:bg-white/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary transition-colors group
          ${depth > 0 ? 'ms-2.5' : ''}
          ${isCurrentSection ? 'bg-white/[0.035]' : ''}
        `}
        aria-expanded={hasContent ? expanded : undefined}
        aria-controls={hasContent ? groupId : undefined}
      >
        {hasContent && (
          <ChevronRight
            size={12}
            className={`text-white/15 transition-transform duration-200 flex-shrink-0
              ${chevronRotation}
            `}
          />
        )}
        {!hasContent && <div className="w-3 flex-shrink-0" />}
        <CategoryIcon
          size={14}
          className={`flex-shrink-0 transition-colors ${
            isCurrentSection
              ? 'text-primary/80'
              : 'text-white/20 group-hover:text-white/45'
          }`}
          aria-hidden="true"
        />
        <span className={`min-w-0 text-[13px] font-medium leading-5 transition-colors ${
          isCurrentSection
            ? 'text-white/80'
            : 'text-white/50 group-hover:text-white/75'
        }`}>
          {category.name}
        </span>
      </button>

      {/* Expanded content */}
      {hasContent && (
        <div id={groupId} hidden={!expanded} className={`${depth > 0 ? 'ms-2.5' : ''}`} role="group" aria-label={category.name}>
          {/* [DOCS-NAV-DETAILS 2026-10-08 by Codex] Overview retains the CMS category URL. */}
          <Link
            href={`${languagePathPrefix(currentLanguage)}/${category.slug}`}
            aria-current={isCurrentCategory ? 'page' : undefined}
            className={`ms-[21px] my-1 block rounded-md px-2.5 py-[7px] text-[12px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
              isCurrentCategory ? 'bg-primary/[0.1] text-primary-200' : 'text-white/40 hover:bg-white/[0.025] hover:text-white/65'
            }`}
          >
            {navigationOverviewLabel(currentLanguage)}
          </Link>
          {/* [DOCS-NAVIGATION 2026-10-08 by Codex] Guides precede console subgroups. */}
          {/* Articles in this category */}
          {hasArticles && (
            <div className="ms-[21px] mt-0.5 mb-1.5 border-s border-white/[0.06] ps-2 space-y-px">
              {category.articles.map((article) => (
                <ArticleLink
                  key={article.id || article.slug}
                  article={article}
                  categorySlug={category.slug}
                  currentLanguage={currentLanguage}
                  isActive={article.slug === currentSlug || article.translation_key === currentSlug}
                />
              ))}
            </div>
          )}
          {/* Child categories (recursive) */}
          {hasChildren &&
            category.children.map((child) => (
              <CategoryGroup
                key={child.id || child.slug}
                category={child}
                currentSlug={currentSlug}
                currentCategorySlug={currentCategorySlug}
                currentLanguage={currentLanguage}
                depth={depth + 1}
              />
            ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// ArticleLink — Single article nav item
// ============================================

function ArticleLink({ article, categorySlug, currentLanguage, isActive }) {
  return (
    <Link
      href={articleHref(article, currentLanguage, categorySlug)}
      className={`
        block px-2.5 py-[7px] rounded-md text-[13px] leading-[1.35rem] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary transition-all
        ${
          isActive
            ? 'bg-primary/[0.1] text-primary-200 font-medium'
            : 'text-white/40 hover:text-white/65 hover:bg-white/[0.025]'
        }
      `}
      aria-current={isActive ? 'page' : undefined}
    >
      {article.title}
    </Link>
  );
}
