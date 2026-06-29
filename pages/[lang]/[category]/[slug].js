/**
 * ============================================
 * File: docs-frontend/pages/[lang]/[category]/[slug].js
 * ============================================
 * Creation Reason: Provide SEO-friendly language-prefixed article routes.
 * Modification Reason: v1.0.0 - Add multilingual article entrypoint so docs
 * can be indexed as /ja/network/article while sharing the canonical renderer.
 * Main Functionality:
 *   - Render translated article pages for every supported language
 *   - Preserve canonical article slugs via translation_key
 *   - Reuse the existing article page, TOC, markdown renderer, and SEO tags
 * Dependencies:
 *   - pages/[category]/[slug].js (shared article component/data helper)
 *   - lib/api.js (normalizeLanguage)
 *
 * Main Logical Flow:
 * 1. Read the language segment from the URL.
 * 2. Normalize it against SUPPORTED_LANGUAGES.
 * 3. Fetch the article using the requested language and shared canonical slug.
 *
 * ⚠️ Important Note for Next Developer:
 * - Do not fork article rendering in this file. The shared article page owns
 *   layout, metadata, breadcrumbs, and navigation behavior.
 * - Backend Article.translation_key is the stable slug across languages.
 *
 * Last Modified: v1.0.0 - Multilingual docs article route
 * ============================================
 */

export { default } from '../../[category]/[slug]';

import { getArticlePageProps } from '../../[category]/[slug]';
import { normalizeLanguage } from '../../../lib/api';

export async function getServerSideProps(context) {
  return getArticlePageProps(context, normalizeLanguage(context.params.lang));
}
