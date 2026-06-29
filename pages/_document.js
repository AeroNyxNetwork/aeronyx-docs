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

import Document, { Html, Head, Main, NextScript } from 'next/document';

const SUPPORTED_LANGUAGES = new Set([
  'en', 'zh-Hans', 'zh-Hant', 'ja', 'ko', 'ru', 'es', 'pt-BR',
  'ar', 'tr', 'vi', 'id', 'fr',
]);

function languageFromPath(path = '/') {
  const firstSegment = path.split('?')[0].split('/').filter(Boolean)[0];
  return SUPPORTED_LANGUAGES.has(firstSegment) ? firstSegment : 'en';
}

export default class AeroNyxDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx);
    const currentLanguage = languageFromPath(ctx.asPath || ctx.pathname || '/');
    return { ...initialProps, currentLanguage };
  }

  render() {
    const { currentLanguage = 'en' } = this.props;
    return (
      <Html
        lang={currentLanguage}
        dir={currentLanguage === 'ar' ? 'rtl' : 'ltr'}
        className="dark"
        suppressHydrationWarning
      >
        <Head />
        <body className="bg-[#09090b] text-white antialiased min-h-screen">
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
