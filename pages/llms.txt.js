/**
 * ============================================
 * File: docs-frontend/pages/llms.txt.js
 * ============================================
 * Creation Reason: Expose AeroNyx GEO/LLM summaries at /llms.txt.
 * Modification Reason:
 *   v1.2.1 - [DOCS-NODE-EVIDENCE 2026-08-31 by Codex] Add a stable,
 *     machine-readable evidence version header for deployment verification.
 *   v1.2.0 - [DOCS-EDITORIAL 2026-08-04 by Codex] Remove the duplicated,
 *     milestone-era English fallback; compose every language from the backend
 *     or its matching local fallback so partial API failures cannot produce a
 *     partial or internally inconsistent root document.
 *   v1.1.7 - Add guarded node build-cache GEO fallback.
 *   v1.1.6 - Add verifiable blind-ledger GEO fallback.
 *   v1.1.5 - Add the privacy-network versus traditional-VPN reference.
 *   v1.1.4 - Replace public Rust implementation labels with product terms.
 *   v1.1.3 - Add v0.1 protocol status and network-stat sources.
 *   v1.1.2 - Add deterministic multilingual local fallbacks.
 *   v1.1.1 - Try configured and canonical API bases.
 *   v1.1.0 - Publish all language variants from the root text route.
 *   v1.0.10 - Read language from resolvedUrl.
 *   v1.0.9 - Read language from the request URL on Vercel.
 *   v1.0.8 - Preserve the language query when proxying to Django.
 *   v1.0.7 - Add PeerStore lifecycle fallback metadata.
 *   v1.0.6 - Add blind-relay abuse-guard metadata.
 *   v1.0.5 - Add discovery restart-recovery readiness.
 *   v1.0.4 - Add node-discovery and relay-foundation readiness.
 *   v1.0.3 - Add the blind-node invariant.
 *   v1.0.2 - Add packet-runtime stability telemetry.
 *   v1.0.1 - Add operator, MemChain, and agent-service positioning.
 *   v1.0.0 - Initial implementation.
 *
 * Main Functionality:
 *   - Fetch each supported language from Django's canonical llms.txt API
 *   - Fall back per language instead of discarding successful variants
 *   - Return one deterministic multilingual text/plain document
 *
 * Main Logical Flow:
 *   1. Fetch all supported languages concurrently with bounded timeouts.
 *   2. Use the matching local fallback for any failed language.
 *   3. Join variants in a stable order and return cacheable plain text.
 *
 * Dependencies:
 *   - NEXT_PUBLIC_API_BASE_URL
 *   - lib/llmsFallbacks.js
 *
 * Important Note for Next Developer:
 * - Keep this route text/plain and preserve all supported languages.
 * - Django remains canonical; local fallbacks must carry the same product
 *   definition, privacy boundary, page order, and public URLs.
 * - Never include user data, node identifiers, routes, or private telemetry.
 *
 * Last Modified: v1.2.1 - Machine-readable evidence deployment version
 * ============================================
 */

import {
  LLMS_LANGUAGES,
  getAllLlmsFallbacks,
  getLlmsFallback,
} from '../lib/llmsFallbacks';

const CANONICAL_API_BASE = 'https://api.aeronyx.network/api';
const FETCH_TIMEOUT_MS = 4500;
const EVIDENCE_VERSION = 'r8-d1-2026-08-31';

export default function LlmsTxt() {
  return null;
}

function apiCandidates(configuredBase) {
  return Array.from(new Set([configuredBase, CANONICAL_API_BASE]))
    .map((base) => String(base || '').replace(/\/+$/, ''))
    .filter(Boolean);
}

async function fetchLlmsVariant(apiBase, lang) {
  const params = new URLSearchParams();
  if (lang !== 'en') params.set('lang', lang);
  const query = params.toString();

  for (const base of apiCandidates(apiBase)) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const url = `${base}/docs/llms.txt${query ? `?${query}` : ''}`;

    try {
      const response = await fetch(url, {
        headers: { Accept: 'text/plain' },
        signal: controller.signal,
      });
      if (!response.ok) continue;

      const text = (await response.text()).trim();
      if (text.startsWith('# ')) return text;
    } catch {
      // [DOCS-EDITORIAL 2026-08-04 by Codex] A single language or API origin
      // must not collapse the complete GEO document. The caller supplies the
      // same-language deterministic fallback.
    } finally {
      clearTimeout(timeout);
    }
  }

  return null;
}

async function buildMultilingualDocument(apiBase) {
  const variants = await Promise.all(
    LLMS_LANGUAGES.map(async ([code, label]) => ({
      code,
      label,
      text: (await fetchLlmsVariant(apiBase, code)) || getLlmsFallback(code),
    }))
  );

  return variants
    .map(({ code, label, text }) => [
      `<!-- AeroNyx llms language: ${code} (${label}) -->`,
      text.trim(),
    ].join('\n'))
    .join('\n\n---\n\n');
}

// [DOCS-NODE-EVIDENCE 2026-08-31 by Codex] Keep response identity and cache
// policy centralized so both the API-backed and emergency fallback paths are
// externally distinguishable as the same evidence release.
function setLlmsHeaders(res, cacheControl) {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', cacheControl);
  res.setHeader('X-AeroNyx-Docs-Evidence-Version', EVIDENCE_VERSION);
}

export async function getServerSideProps({ res }) {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || CANONICAL_API_BASE;

  try {
    const text = await buildMultilingualDocument(apiBase);
    res.statusCode = 200;
    setLlmsHeaders(res, 'public, max-age=300, stale-while-revalidate=900');
    res.end(text);
  } catch {
    res.statusCode = 200;
    setLlmsHeaders(res, 'public, max-age=60');
    res.end(getAllLlmsFallbacks());
  }

  return { props: {} };
}
