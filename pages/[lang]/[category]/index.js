/**
 * ============================================
 * File: docs-frontend/pages/[lang]/[category]/index.js
 * ============================================
 * Creation Reason: Provide SEO-friendly language-prefixed category routes.
 * Modification Reason: v1.0.0 - Add multilingual category entrypoint while
 * reusing the existing category page implementation.
 * Main Functionality:
 *   - Render /ja/network, /zh-Hant/node-operators, etc.
 *   - Fetch category article lists using the requested language.
 *   - Preserve the same desktop/mobile layout as the canonical category page.
 * Dependencies:
 *   - pages/[category]/index.js (shared category component/data helper)
 *   - lib/api.js (normalizeLanguage)
 *
 * Main Logical Flow:
 * 1. Normalize the language path segment.
 * 2. Delegate data fetching to getCategoryPageProps().
 * 3. Render the shared category page.
 *
 * ⚠️ Important Note for Next Developer:
 * - This route must stay aligned with pages/[category]/index.js.
 * - Do not add category-specific translation logic here; the backend owns
 *   article language filtering.
 *
 * Last Modified: v1.0.0 - Multilingual docs category route
 * ============================================
 */

export { default } from '../../[category]/index';

import { getCategoryPageProps } from '../../[category]/index';
import { normalizeLanguage } from '../../../lib/api';

export async function getServerSideProps(context) {
  return getCategoryPageProps(context, normalizeLanguage(context.params.lang));
}
