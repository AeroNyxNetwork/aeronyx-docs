/**
 * ============================================
 * File: docs-frontend/components/Layout.js
 * ============================================
 * Creation Reason: Wraps all pages with Header, Sidebar, and SearchModal
 * Modification Reason: v1.0.1 - Added max-width constraint for ultra-wide
 *   screens, improved SEO meta tags, canonical URL support
 *
 * Main Functionality:
 *   - Fixed header (56px / h-14)
 *   - Sticky sidebar on desktop, drawer on mobile
 *   - Main content area with proper spacing
 *   - Search modal state management
 *   - SEO head tags with OG and Twitter cards
 *
 * Main Logical Flow:
 *   1. Layout receives categoryTree from page-level getServerSideProps
 *   2. Passes tree to Sidebar and SearchModal
 *   3. Manages mobile sidebar open/close state
 *   4. Manages search modal open/close state
 *
 * Dependencies:
 *   - Header.js, Sidebar.js, SearchModal.js
 *   - next/head
 *
 * ⚠️ Important Note for Next Developer:
 * - categoryTree is fetched at page level and passed down
 * - Each page must pass categoryTree as a prop to Layout
 * - Layout does NOT fetch data itself
 *
 * Last Modified: v1.0.1 - Max-width + SEO improvements
 * ============================================
 */

import { useState, useCallback } from 'react';
import Head from 'next/head';
import Header from './Header';
import Sidebar from './Sidebar';
import SearchModal from './SearchModal';

export default function Layout({
  children,
  categoryTree = [],
  title = 'AeroNyx Docs',
  description = 'AeroNyx Network — Documentation, guides, and technical references.',
  meta = {},
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const handleToggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);
  const handleCloseSidebar = useCallback(() => setSidebarOpen(false), []);
  const handleOpenSearch = useCallback(() => setSearchOpen(true), []);
  const handleCloseSearch = useCallback(() => setSearchOpen(false), []);

  const fullTitle = title === 'AeroNyx Docs' ? title : `${title} — AeroNyx Docs`;

  return (
    <>
      <Head>
        <title>{fullTitle}</title>
        <meta name="description" content={description} />
        {meta.keywords && <meta name="keywords" content={meta.keywords} />}

        {/* Open Graph */}
        <meta property="og:title" content={fullTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="AeroNyx Docs" />
        {meta.image && <meta property="og:image" content={meta.image} />}

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={fullTitle} />
        <meta name="twitter:description" content={description} />
        {meta.image && <meta name="twitter:image" content={meta.image} />}
      </Head>

      {/* Header */}
      <Header
        onToggleSidebar={handleToggleSidebar}
        onOpenSearch={handleOpenSearch}
      />

      {/* Body: Sidebar + Content */}
      <div className="flex pt-14 min-h-screen max-w-[1800px] mx-auto">
        {/* Sidebar */}
        <Sidebar
          categoryTree={categoryTree}
          isOpen={sidebarOpen}
          onClose={handleCloseSidebar}
        />

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>

      {/* Search modal overlay */}
      <SearchModal
        isOpen={searchOpen}
        onClose={handleCloseSearch}
      />
    </>
  );
}
