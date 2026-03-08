/**
 * ============================================
 * File: docs-frontend/pages/_document.js
 * ============================================
 * Creation Reason: Custom HTML Document for dark mode, lang attribute
 * Modification Reason: v1.0.1 - Suppressed hydration warnings for
 *   browser extensions, added explicit class for bg
 *
 * Last Modified: v1.0.1
 * ============================================
 */

import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en" className="dark" suppressHydrationWarning>
      <Head />
      <body className="bg-[#09090b] text-white antialiased min-h-screen">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
