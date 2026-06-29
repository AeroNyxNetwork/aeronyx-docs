/**
 * ============================================
 * File: docs-frontend/components/Header.js
 * ============================================
 * Creation Reason: Persistent top bar with logo, search trigger, nav links
 * Modification Reason:
 *   v1.2.0 - Added language switcher for multilingual SEO/GEO routes.
 *   v1.1.0 - Read external link label/url from docs SiteConfig.
 *   v1.0.1 - Added scroll-aware shadow/border transition,
 *   improved keyboard shortcut display (Mac vs Win), accessibility labels
 *
 * Main Functionality:
 *   - AeroNyx logo (SVG from brand assets)
 *   - Search shortcut (Ctrl+K / Cmd+K) with platform detection
 *   - Link back to main site
 *   - Language switcher
 *   - Mobile hamburger menu
 *   - Subtle border opacity change on scroll
 *
 * Dependencies:
 *   - SearchModal (opened via callback prop)
 *   - next/link
 *   - lucide-react (icons)
 *
 * ⚠️ Important Note for Next Developer:
 * - onToggleSidebar is used on mobile to open sidebar drawer
 * - onOpenSearch opens the search modal
 * - Scroll listener adds subtle shadow after 10px scroll
 *
 * Last Modified: v1.2.0 - Multilingual language switcher
 * ============================================
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Menu, Search, ExternalLink, Globe2 } from 'lucide-react';
import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  languagePathPrefix,
  normalizeLanguage,
} from '../lib/api';

const AeroNyxLogo = () => (
  <svg
    width="26"
    height="26"
    viewBox="0 0 512 512"
    preserveAspectRatio="xMidYMid meet"
    className="flex-shrink-0"
    aria-hidden="true"
  >
    <g transform="translate(0,512) scale(0.1,-0.1)" fill="#7762F3" stroke="none">
      <path d="M1277 3833 l-1277 -1278 0 -1275 0 -1275 1280 1280 1280 1280 -2 1273 -3 1272 -1278 -1277z" />
      <path d="M3838 3833 l-1278 -1278 0 -1275 0 -1275 1280 1280 1280 1280 -2 1273-3 1272-1277 -1277z" />
    </g>
  </svg>
);

function stripLanguagePrefix(path) {
  const withoutQuery = path.split('?')[0] || '/';
  const matched = SUPPORTED_LANGUAGES.find(
    (item) => item.code !== DEFAULT_LANGUAGE
      && (withoutQuery === `/${item.code}` || withoutQuery.startsWith(`/${item.code}/`))
  );
  if (!matched) return path || '/';
  const query = path.includes('?') ? `?${path.split('?').slice(1).join('?')}` : '';
  const stripped = withoutQuery.slice(matched.code.length + 1) || '/';
  return `${stripped}${query}`;
}

function buildLanguagePath(path, lang) {
  const basePath = stripLanguagePrefix(path || '/');
  const prefix = languagePathPrefix(lang);
  if (!prefix) return basePath || '/';
  return `${prefix}${basePath === '/' ? '' : basePath}`;
}

export default function Header({
  onToggleSidebar,
  onOpenSearch,
  siteConfig = null,
  currentLanguage = DEFAULT_LANGUAGE,
}) {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [isMac, setIsMac] = useState(false);
  const normalizedLanguage = normalizeLanguage(currentLanguage);

  // Detect platform for keyboard shortcut display
  useEffect(() => {
    setIsMac(
      typeof navigator !== 'undefined' &&
      /Mac|iPod|iPhone|iPad/.test(navigator.userAgent)
    );
  }, []);

  // Scroll shadow effect
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Global keyboard shortcut: Ctrl+K / Cmd+K → open search
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenSearch?.();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onOpenSearch]);

  return (
    <header
      className={`
        fixed top-0 left-0 right-0 z-50 h-14
        bg-[#09090b]/80 backdrop-blur-xl
        border-b transition-all duration-300
        ${scrolled
          ? 'border-white/[0.08] shadow-[0_1px_12px_rgba(0,0,0,0.4)]'
          : 'border-white/[0.04]'
        }
      `}
    >
      <div className="flex items-center justify-between h-full px-4 lg:px-6 max-w-[1800px] mx-auto">
        {/* Left: hamburger + logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-1.5 rounded-md hover:bg-white/5 active:bg-white/10 transition-colors"
            aria-label="Toggle navigation sidebar"
          >
            <Menu size={20} className="text-white/60" />
          </button>

          <Link
            href={languagePathPrefix(normalizedLanguage) || '/'}
            className="flex items-center gap-2.5 group"
          >
            <AeroNyxLogo />
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-semibold text-white/90 group-hover:text-white transition-colors">
                AeroNyx
              </span>
              <span className="text-[11px] font-medium text-white/25 hidden sm:inline tracking-wide">
                Docs
              </span>
            </div>
          </Link>
        </div>

        {/* Center: search bar */}
        <button
          onClick={onOpenSearch}
          className="hidden sm:flex items-center gap-2.5 px-3.5 py-1.5 rounded-lg
            border border-white/[0.06] bg-white/[0.02]
            hover:bg-white/[0.05] hover:border-white/[0.1]
            transition-all max-w-xs w-full mx-4 lg:mx-8 group"
          aria-label="Search documentation"
        >
          <Search size={14} className="text-white/25 group-hover:text-white/40 transition-colors" />
          <span className="text-[13px] text-white/25 flex-1 text-left">Search docs...</span>
          <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded
            bg-white/[0.04] border border-white/[0.06]
            text-[10px] text-white/20 font-mono leading-none"
          >
            {isMac ? '⌘' : 'Ctrl+'}K
          </kbd>
        </button>

        {/* Right: nav links */}
        <div className="flex items-center gap-1">
          {/* Mobile search icon */}
          <button
            onClick={onOpenSearch}
            className="sm:hidden p-1.5 rounded-md hover:bg-white/5 transition-colors"
            aria-label="Search"
          >
            <Search size={18} className="text-white/50" />
          </button>

          <label className="hidden md:flex items-center gap-1.5 px-2 py-1.5 rounded-md border border-white/[0.06] bg-white/[0.02] text-white/35 hover:text-white/65 hover:bg-white/[0.04] transition-all">
            <Globe2 size={13} />
            <span className="sr-only">Language</span>
            <select
              value={normalizedLanguage}
              onChange={(event) => {
                const nextPath = buildLanguagePath(router.asPath, event.target.value);
                router.push(nextPath);
              }}
              className="bg-transparent text-xs outline-none cursor-pointer"
              aria-label="Select documentation language"
            >
              {SUPPORTED_LANGUAGES.map((language) => (
                <option key={language.code} value={language.code} className="bg-[#09090b] text-white">
                  {language.nativeLabel}
                </option>
              ))}
            </select>
          </label>

          <a
            href={siteConfig?.external_link_url || 'https://aeronyx.network'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md
              text-xs text-white/30 hover:text-white/60 hover:bg-white/[0.04]
              transition-all"
          >
            <span className="hidden sm:inline">
              {siteConfig?.external_link_label || 'aeronyx.network'}
            </span>
            <ExternalLink size={11} />
          </a>
        </div>
      </div>
    </header>
  );
}
