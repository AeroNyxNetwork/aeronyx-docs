/**
 * ============================================
 * File: docs-frontend/lib/api.js
 * ============================================
 * Creation Reason: Centralize all API calls to Django docs endpoints
 * Modification Reason:
 *   v1.1.0 - Added fetchSiteConfig() and fetchNetworkStats() for GEO/LLM
 *     optimization, admin-controlled homepage copy, and public network data page.
 *   v1.0.1 - Fixed searchArticles() return format
 *   (was returning raw object, now correctly returns array),
 *   added request timeout, improved error messages
 *
 * Main Functionality:
 *   - fetchSiteConfig()    → GET /api/docs/site/
 *   - fetchCategoryTree()  → GET /api/docs/categories/tree/
 *   - fetchArticleList()   → GET /api/docs/articles/
 *   - fetchArticleBySlug() → GET /api/docs/articles/<slug>/
 *   - searchArticles()     → GET /api/docs/articles/search/?q=
 *   - fetchNetworkStats()  → GET /api/vpn/public/network-stats/
 *
 * Main Logical Flow:
 *   1. All functions call the base API URL via apiFetch()
 *   2. Response is normalized: Django returns { code, message, data }
 *   3. DRF paginated responses { count, next, results } are also handled
 *   4. 10s timeout prevents hanging requests
 *
 * Dependencies: None (native fetch + AbortController)
 *
 * ⚠️ Important Note for Next Developer:
 * - API_BASE is set via env var NEXT_PUBLIC_API_BASE_URL
 * - SSR calls go directly to the API; client calls may use proxy
 * - All Django responses follow { code: 0, message: 'success', data: ... }
 * - searchArticles returns { code: 0, data: [...], keyword, total }
 *   so we must extract data array specifically
 *
 * Last Modified: v1.1.0 - GEO site config + network stats API helpers
 * ============================================
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.aeronyx.network/api';
const REQUEST_TIMEOUT = 10000; // 10 seconds

/**
 * Generic fetch wrapper with error handling & timeout
 * @param {string} endpoint - API path after /api/docs/
 * @param {object} options  - fetch options
 * @returns {object|null}   - raw parsed JSON response or null on error
 */
async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE}/docs/${endpoint}`;

  // Abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...options.headers,
      },
      signal: controller.signal,
      ...options,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.error(`[API] ${res.status} ${res.statusText} — ${url}`);
      return null;
    }

    return await res.json();
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      console.error(`[API] Request timeout (${REQUEST_TIMEOUT}ms) — ${url}`);
    } else {
      console.error(`[API] Fetch error — ${url}:`, err.message);
    }
    return null;
  }
}

async function rawApiFetch(path, options = {}) {
  const url = `${API_BASE}/${path.replace(/^\/+/, '')}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...options.headers,
      },
      signal: controller.signal,
      ...options,
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      console.error(`[API] ${res.status} ${res.statusText} — ${url}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    clearTimeout(timeoutId);
    console.error(`[API] Fetch error — ${url}:`, err.message);
    return null;
  }
}

/**
 * Extract data from normalized Django response
 * Django returns: { code: 0, message: 'success', data: ... }
 * DRF pagination: { count, next, previous, results }
 */
function extractData(json) {
  if (!json) return null;

  // Django custom wrapper: { code, message, data }
  if (json.code !== undefined) {
    return json.code === 0 ? json.data : null;
  }

  // DRF paginated response: { count, next, previous, results }
  if (json.results !== undefined) {
    return {
      results: json.results,
      count: json.count,
      next: json.next,
      previous: json.previous,
    };
  }

  // Raw data (plain array or object)
  return json;
}

// ============================================
// Public API Functions
// ============================================

export async function fetchSiteConfig() {
  const json = await apiFetch('site/');
  return extractData(json);
}

/**
 * Get full category tree (with nested children + article slugs)
 * Used by Sidebar component
 * @returns {Array|null}
 */
export async function fetchCategoryTree() {
  const json = await apiFetch('categories/tree/');
  return extractData(json);
}

/**
 * Get flat list of all categories
 * @returns {Array|null}
 */
export async function fetchCategories() {
  const json = await apiFetch('categories/');
  return extractData(json);
}

/**
 * Get published articles, optionally filtered by category slug
 * @param {object} params
 * @param {string} params.category - category slug filter
 * @param {boolean} params.pinned  - only pinned articles
 * @param {number} params.page     - page number
 * @returns {object|null} - { results, count, next, previous } or raw array
 */
export async function fetchArticleList({ category, pinned, page } = {}) {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (pinned) params.set('pinned', 'true');
  if (page) params.set('page', String(page));

  const query = params.toString();
  const json = await apiFetch(`articles/${query ? `?${query}` : ''}`);
  return extractData(json);
}

/**
 * Get single article by slug (full markdown content)
 * @param {string} slug
 * @returns {object|null} - article detail object
 */
export async function fetchArticleBySlug(slug) {
  if (!slug) return null;
  const json = await apiFetch(`articles/${encodeURIComponent(slug)}/`);
  return extractData(json);
}

/**
 * Search articles by keyword
 * BUG FIX (v1.0.1): The search endpoint returns:
 *   { code: 0, message: 'success', data: [...], keyword: '...', total: N }
 * extractData() returns the `data` array correctly.
 * We always return an array (empty on failure).
 *
 * @param {string} keyword - min 2 characters
 * @returns {Array} - array of article objects, never null
 */
export async function searchArticles(keyword) {
  if (!keyword || keyword.trim().length < 2) return [];

  const json = await apiFetch(`articles/search/?q=${encodeURIComponent(keyword.trim())}`);
  const data = extractData(json);

  // Ensure we always return an array
  if (Array.isArray(data)) return data;
  return [];
}

export async function fetchNetworkStats() {
  const json = await rawApiFetch('vpn/public/network-stats/');
  if (!json) return null;
  if (json.success === true && json.data) return json.data;
  return extractData(json);
}
