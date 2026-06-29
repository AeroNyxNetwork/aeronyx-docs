/**
 * ============================================
 * File: docs-frontend/pages/[lang]/index.js
 * ============================================
 * Creation Reason: Provide SEO-friendly language-prefixed docs homepage routes.
 * Modification Reason: v1.0.0 - Add multilingual docs entrypoint for global
 * GEO/SEO visibility without duplicating homepage rendering logic.
 * Main Functionality:
 *   - Accept /zh-Hant, /ja, /ko, /ru and other supported language prefixes
 *   - Reuse the canonical docs homepage component
 *   - Pass a normalized language into the API layer
 * Dependencies:
 *   - pages/index.js (shared homepage component and data helper)
 *   - lib/api.js (normalizeLanguage)
 *
 * Main Logical Flow:
 * 1. Read the language segment from the URL.
 * 2. Normalize unsupported values to English.
 * 3. Fetch the same homepage payload with the requested language.
 *
 * ⚠️ Important Note for Next Developer:
 * - Keep this file as a thin route wrapper. Do not fork homepage UI here.
 * - Add new language codes in lib/api.js and backend Article.LANGUAGE_CHOICES.
 *
 * Last Modified: v1.0.0 - Multilingual docs homepage route
 * ============================================
 */

export { default } from '../index';

import { getDocsHomeProps } from '../index';
import { normalizeLanguage } from '../../lib/api';

export async function getServerSideProps(context) {
  return getDocsHomeProps(normalizeLanguage(context.params.lang));
}
