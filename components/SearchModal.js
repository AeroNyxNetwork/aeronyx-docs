/**
 * ============================================
 * File: docs-frontend/components/SearchModal.js
 * ============================================
 * Creation Reason: Cmd+K search overlay for quick article lookup
 * Modification Reason: v1.0.1 - Added loading skeleton, improved empty
 *   state visuals, added result count badge, smoother transitions
 *
 * Main Functionality:
 *   - Debounced search input (300ms)
 *   - Calls /api/docs/articles/search/?q=
 *   - Keyboard navigation (↑↓ + Enter)
 *   - ESC to close
 *   - Platform-aware shortcut hint
 *
 * Dependencies:
 *   - lib/api.js → searchArticles()
 *   - next/router (navigation on select)
 *   - lucide-react (icons)
 *
 * ⚠️ Important Note for Next Developer:
 * - Debounce is 300ms to avoid excessive API calls
 * - Results are ArticleListSerializer (no content field)
 * - searchArticles() always returns an array (fixed in v1.0.1)
 * - Scroll selected item into view for long result lists
 *
 * Last Modified: v1.0.1 - Skeleton + count badge + scroll into view
 * ============================================
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Search, FileText, ArrowRight, X, Loader2 } from 'lucide-react';
import { searchArticles } from '../lib/api';

export default function SearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const router = useRouter();

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // ESC to close, prevent body scroll
  useEffect(() => {
    if (!isOpen) return;

    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };

    // Lock body scroll
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handler);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handler);
    };
  }, [isOpen, onClose]);

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      const data = await searchArticles(query);
      setResults(data);
      setSelectedIndex(0);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Scroll selected item into view
  useEffect(() => {
    if (results.length === 0) return;
    const el = listRef.current?.children?.[selectedIndex];
    el?.scrollIntoView?.({ block: 'nearest' });
  }, [selectedIndex, results.length]);

  // Build article URL
  const getArticleUrl = useCallback((article) => {
    const catSlug = article.category_slug || 'uncategorized';
    return `/${catSlug}/${article.slug}`;
  }, []);

  // Navigate to selected result
  const handleSelect = useCallback(
    (article) => {
      onClose();
      router.push(getArticleUrl(article));
    },
    [onClose, router, getArticleUrl]
  );

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] sm:pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-xl mx-4 bg-surface-100 border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/40 overflow-hidden animate-slide-up">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.06]">
          {loading ? (
            <Loader2 size={16} className="text-primary animate-spin flex-shrink-0" />
          ) : (
            <Search size={16} className="text-white/25 flex-shrink-0" />
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search documentation..."
            className="flex-1 bg-transparent text-sm text-white/90 placeholder:text-white/25 outline-none"
            autoComplete="off"
            spellCheck={false}
          />
          {query && (
            <button
              onClick={() => { setQuery(''); inputRef.current?.focus(); }}
              className="p-1 rounded-md hover:bg-white/5 transition-colors"
              aria-label="Clear search"
            >
              <X size={14} className="text-white/25" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-[10px] text-white/20 font-mono">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[360px] overflow-y-auto overscroll-contain">
          {/* Loading skeleton */}
          {loading && query.length >= 2 && (
            <div className="py-3 px-2 space-y-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-3 rounded-lg">
                  <div className="w-4 h-4 rounded bg-white/[0.04] animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-white/[0.04] rounded animate-pulse w-3/4" />
                    <div className="h-2.5 bg-white/[0.03] rounded animate-pulse w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No results */}
          {!loading && query.length >= 2 && results.length === 0 && (
            <div className="px-4 py-10 text-center">
              <div className="text-2xl mb-3 opacity-30">🔍</div>
              <div className="text-sm text-white/30 mb-1">No results found</div>
              <div className="text-xs text-white/15">Try different or broader keywords</div>
            </div>
          )}

          {/* Result items */}
          {!loading && results.length > 0 && (
            <div ref={listRef} className="py-2 px-2" role="listbox">
              {/* Count badge */}
              <div className="px-3 py-1.5 text-[10px] text-white/20 uppercase tracking-wider">
                {results.length} result{results.length !== 1 ? 's' : ''}
              </div>

              {results.map((article, i) => (
                <button
                  key={article.id}
                  onClick={() => handleSelect(article)}
                  onMouseEnter={() => setSelectedIndex(i)}
                  role="option"
                  aria-selected={i === selectedIndex}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors
                    ${i === selectedIndex
                      ? 'bg-primary/[0.08] ring-1 ring-primary/20'
                      : 'hover:bg-white/[0.02]'
                    }
                  `}
                >
                  <FileText
                    size={15}
                    className={`flex-shrink-0 ${
                      i === selectedIndex ? 'text-primary/70' : 'text-white/15'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-[13px] truncate ${
                        i === selectedIndex ? 'text-white/90' : 'text-white/60'
                      }`}
                    >
                      {article.title}
                    </div>
                    {article.summary && (
                      <div className="text-xs text-white/25 truncate mt-0.5">
                        {article.summary}
                      </div>
                    )}
                    {article.category_name && (
                      <div className="text-[10px] text-white/15 mt-0.5">
                        {article.category_name}
                      </div>
                    )}
                  </div>
                  <ArrowRight
                    size={13}
                    className={`flex-shrink-0 transition-all ${
                      i === selectedIndex
                        ? 'text-primary/50 opacity-100 translate-x-0'
                        : 'opacity-0 -translate-x-1'
                    }`}
                  />
                </button>
              ))}
            </div>
          )}

          {/* Initial state */}
          {!loading && query.length < 2 && (
            <div className="px-4 py-10 text-center">
              <div className="text-sm text-white/15">Type at least 2 characters to search</div>
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-white/[0.04] text-[10px] text-white/15">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-px rounded bg-white/[0.04] text-[9px]">↑</kbd>
              <kbd className="px-1 py-px rounded bg-white/[0.04] text-[9px]">↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-px rounded bg-white/[0.04] text-[9px]">↵</kbd>
              Open
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-px rounded bg-white/[0.04] text-[9px]">Esc</kbd>
            Close
          </span>
        </div>
      </div>
    </div>
  );
}
