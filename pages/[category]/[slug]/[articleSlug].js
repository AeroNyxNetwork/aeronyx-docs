/**
 * ============================================
 * File: docs-frontend/pages/[category]/[slug]/[articleSlug].js
 * ============================================
 * Creation Reason: Support SEO-friendly multilingual article URLs while
 * staying compatible with Next.js pages-router dynamic route constraints.
 * Modification Reason: v1.0.0 - Route /ja/network/article through the same
 * dynamic segment names as existing /network and /network/article routes.
 * Main Functionality:
 *   - Treat the first segment as a language when it matches SUPPORTED_LANGUAGES
 *   - Treat the second segment as the article category
 *   - Reuse the canonical article page and data helper
 * Dependencies:
 *   - pages/[category]/[slug].js
 *   - lib/api.js
 *
 * Main Logical Flow:
 * 1. Validate that the first segment is a supported language code.
 * 2. Rewrite params for the shared article data helper.
 * 3. Render the existing ArticlePage component.
 *
 * ⚠️ Important Note for Next Developer:
 * - Do not rename this to [lang]/[category]/[slug]. Next.js rejects sibling
 *   dynamic route params with different names at the same path depth.
 * - This wrapper preserves public URLs like /ja/network/article-slug.
 *
 * Last Modified: v1.0.0 - Multilingual article route without dynamic conflict
 * ============================================
 */

export { default } from '../[slug]';

import { getArticlePageProps } from '../[slug]';
import { SUPPORTED_LANGUAGES, normalizeLanguage } from '../../../lib/api';

export async function getServerSideProps(context) {
  const { category, slug, articleSlug } = context.params;
  const isLanguage = SUPPORTED_LANGUAGES.some((language) => language.code === category);

  if (!isLanguage) {
    return { notFound: true };
  }

  return getArticlePageProps(
    { params: { category: slug, slug: articleSlug } },
    normalizeLanguage(category)
  );
}
