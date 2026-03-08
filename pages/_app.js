/**
 * ============================================
 * File: docs-frontend/pages/_app.js
 * ============================================
 * Creation Reason: Global providers, styles, and fonts
 * Modification Reason: v1.0.1 - Added preload for critical fonts,
 *   meta charset, and error boundary consideration
 *
 * Dependencies: globals.css, Inter + JetBrains Mono fonts
 *
 * ⚠️ Important Note for Next Developer:
 * - Fonts are loaded from Google Fonts CDN
 * - For self-hosted fonts, use next/font instead
 * - All global CSS must be imported here
 *
 * Last Modified: v1.0.1 - Font preload + meta fixes
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

        {/* Font preconnect + load */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />

        {/* Favicon */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
