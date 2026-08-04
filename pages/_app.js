/**
 * ============================================
 * File: docs-frontend/pages/_app.js
 * ============================================
 * Creation Reason: Global providers, styles, and fonts
 * Modification Reason: v1.0.1 - Added preload for critical fonts,
 *   meta charset, and error boundary consideration
 * Modification Reason: v1.0.2 - Added complete docs icon metadata.
 *   The docs shell referenced favicon.svg before the public icon assets
 *   existed. The head now advertises SVG, ICO, PNG, Apple touch, and web
 *   manifest assets so browser tabs, mobile bookmarks, and AI/browser preview
 *   surfaces all show the AeroNyx brand mark.
 * Modification Reason: v1.0.3 - [DOCS-UX 2026-08-04 by Codex] Remove the
 *   third-party font request; the docs now use a fast native system stack.
 *
 * Dependencies: globals.css
 *
 * ⚠️ Important Note for Next Developer:
 * - Typography uses the native platform font stack from globals.css
 * - Do not add remote font calls without a privacy and performance review
 * - All global CSS must be imported here
 *
 * Last Modified: v1.0.1 - Font preload + meta fixes
 * Last Modified: v1.0.2 - Complete docs icon metadata
 * Last Modified: v1.0.3 - Native system fonts
 * ============================================
 */

import '../styles/globals.css';
import Head from 'next/head';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#09090b" />

        {/* Favicon / install metadata */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="icon" href="/favicon-32x32.png" sizes="32x32" type="image/png" />
        <link rel="shortcut icon" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
        <link rel="manifest" href="/site.webmanifest" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
