# AeroNyx Documentation System — Architecture Guide

> **Version:** 1.0.1  
> **Last Updated:** 2026-03-08  
> **Stack:** Django 4.2 + Django REST Framework (Backend) · Next.js 14 + Tailwind CSS (Frontend)  
> **Author:** AeroNyx Engineering

---

## Table of Contents

1. [System Overview](#system-overview)  
2. [Architecture Diagram](#architecture-diagram)  
3. [Backend — Django `docs` App](#backend--django-docs-app)  
4. [Frontend — Next.js `docs-frontend`](#frontend--nextjs-docs-frontend)  
5. [API Reference](#api-reference)  
6. [Data Flow](#data-flow)  
7. [File Index — Backend](#file-index--backend)  
8. [File Index — Frontend](#file-index--frontend)  
9. [Configuration & Environment](#configuration--environment)  
10. [Deployment](#deployment)  
11. [Known Decisions & Trade-offs](#known-decisions--trade-offs)  
12. [Onboarding Checklist for New Developers](#onboarding-checklist-for-new-developers)

---

## System Overview

The documentation system is a **GitBook-style blog/docs platform** built as two independent services:

- **Backend** — A Django app (`docs`) inside the existing `suifly` project. It exposes a RESTful JSON API for categories and articles. Content is authored in Markdown via the Django Admin panel (SimplePro).
- **Frontend** — A standalone Next.js 14 application that consumes the API and renders a server-side-rendered documentation website with sidebar navigation, full-text search, syntax-highlighted Markdown, and a reading progress bar.

The two services communicate exclusively over HTTP JSON APIs. The frontend can be deployed on any static/Node hosting (Vercel, Docker, Nginx + PM2) independently of the Django backend.

---

## Backend — Django `docs` App

### Purpose

Provides the data layer and admin interface for managing documentation categories and articles. All content is stored as Markdown in the database and served as JSON through DRF endpoints.

### Key Design Decisions

- **UUID primary keys** — Avoids sequential ID enumeration and is safe for public APIs.
- **Slug-based routing** — Articles and categories use human-readable slugs for SEO-friendly URLs.
- **Tree-structured categories** — Self-referencing `parent` ForeignKey enables unlimited nesting. The `CategoryTreeSerializer` recursively builds the full tree in a single API call.
- **No authentication on read endpoints** — All docs APIs use `AllowAny` permission since this is a public-facing blog.
- **View count with F() expression** — `increment_view()` uses `F('view_count') + 1` to avoid race conditions under concurrent traffic.
- **Auto-publish timestamp** — Setting `status='published'` automatically populates `published_at` via the `save()` override.

### File Index — Backend

| File Path | Purpose |
|---|---|
| `docs/__init__.py` | Python package initializer. Empty by design. |
| `docs/apps.py` | Django AppConfig. Registers the app as `docs` with verbose name "Documentation & Blog". |
| `docs/models.py` | **Core data models.** `Category` (tree structure with parent FK, slug, icon, sort_order) and `Article` (Markdown content, status, pinned, SEO fields, view count). Contains `full_path` property, `article_count` property, and `increment_view()` method. |
| `docs/serializers.py` | **DRF serializers.** `CategorySerializer` (flat), `CategoryTreeSerializer` (recursive with nested children + article list), `ArticleListSerializer` (lightweight, no content), `ArticleDetailSerializer` (full content + prev/next navigation). |
| `docs/views.py` | **API views.** `CategoryTreeView` (GET tree), `CategoryListView` (GET flat list), `ArticleListView` (GET with category/pinned filters), `ArticleDetailView` (GET by slug, increments views), `ArticleSearchView` (GET with keyword search across title/summary/content). |
| `docs/urls.py` | **URL routing.** Maps 5 endpoints under the `docs` namespace. Critical: `search/` route is defined before `<slug:slug>/` to prevent "search" being captured as a slug. |
| `docs/admin.py` | **Admin configuration.** `CategoryAdmin` with inline sort editing, `ArticleAdmin` with bulk publish/unpublish actions, auto-author assignment, SEO fieldset (collapsed), prepopulated slugs. |
| `suifly/settings.py` | **Modified.** Added `'docs'` to `INSTALLED_APPS`. |
| `suifly/urls.py` | **Modified.** Added `path('api/docs/', include('docs.urls'))`. Also fixed `debug_view` to return 403 in production. |

### Database Tables

| Table | Key Columns | Notes |
|---|---|---|
| `docs_category` | `id` (UUID), `name`, `slug` (unique), `parent_id` (self-FK), `icon`, `sort_order`, `is_active` | Tree structure via `parent` |
| `docs_article` | `id` (UUID), `title`, `slug` (unique), `category_id` (FK), `content` (TEXT), `status`, `is_published`, `is_pinned`, `view_count`, `published_at` | Indexed on `(is_published, status)`, `(category, is_published)`, `(slug)` |

---

## Frontend — Next.js `docs-frontend`

### Purpose

Server-side-rendered documentation website that consumes the Django API. Designed to match the AeroNyx brand (dark theme, `#7762F3` purple accent, Inter + JetBrains Mono fonts).

### Key Design Decisions

- **SSR via `getServerSideProps`** — Every page fetches fresh data on each request for SEO and content freshness. Switch to `getStaticProps` + `revalidate` for ISR if traffic increases.
- **Single API client** (`lib/api.js`) — All backend communication goes through centralized functions with unified error handling, 10-second timeout, and response normalization.
- **Sidebar loaded once per page** — `categoryTree` is fetched in every page's `getServerSideProps` and passed to `Layout` → `Sidebar`. This ensures the sidebar is always up to date.
- **Markdown rendering** — `react-markdown` v9 with `remark-gfm` (GitHub Flavored Markdown) and `rehype-highlight` (syntax highlighting). Custom components override every element for brand-consistent styling.
- **No client-side state management library** — React `useState` is sufficient. The app is read-only with no complex state.

### File Index — Frontend

| File Path | Purpose |
|---|---|
| **Configuration** | |
| `docs-frontend/package.json` | Dependencies and scripts. Dev server runs on port 3001. |
| `docs-frontend/next.config.js` | API proxy rewrites, security headers (X-Frame-Options, nosniff), image remote patterns for `api.aeronyx.network` and `binary.aeronyx.network`. |
| `docs-frontend/tailwind.config.js` | Brand color tokens (`primary` #7762F3 with 10 shades, `surface` dark grays), custom `border-l-3` width, fade/slide animations, `@tailwindcss/typography` plugin config with dark-mode prose overrides. |
| `docs-frontend/postcss.config.js` | PostCSS pipeline: Tailwind + Autoprefixer. |
| `docs-frontend/.env.local` | Environment variable `NEXT_PUBLIC_API_BASE_URL`. Not committed to git. |
| **Styles** | |
| `docs-frontend/styles/globals.css` | Global styles: CSS variables (`--primary`, `--surface`), custom scrollbars, reading progress bar, Markdown content overrides (`.markdown-body` scope), code language badge (`.code-lang-badge`), `highlight.js` theme import, `::selection` color, `focus-visible` ring, line-clamp utilities. |
| **Data Layer** | |
| `docs-frontend/lib/api.js` | **API client.** `apiFetch()` base function with 10s AbortController timeout. `extractData()` normalizes Django `{ code, data }` and DRF `{ results, count }` responses. Exports: `fetchCategoryTree()`, `fetchCategories()`, `fetchArticleList({ category, pinned, page })`, `fetchArticleBySlug(slug)`, `searchArticles(keyword)`. Search always returns `[]` on failure. |
| **App Shell** | |
| `docs-frontend/pages/_app.js` | Global entry. Loads Google Fonts (Inter, JetBrains Mono), favicon, viewport meta. |
| `docs-frontend/pages/_document.js` | HTML document. Sets `lang="en"`, dark mode class, background color on `<body>` to prevent FOUC. |
| **Components** | |
| `docs-frontend/components/Layout.js` | **Page wrapper.** Composes Header + Sidebar + SearchModal. Manages sidebar open/close and search open/close state. Renders SEO `<Head>` tags (title, OG, Twitter). Constrains content to `max-w-[1800px]` for ultrawide screens. |
| `docs-frontend/components/Header.js` | **Top navigation bar.** Fixed 56px height. AeroNyx SVG logo. Search trigger with platform-aware shortcut hint (⌘K on Mac, Ctrl+K on Windows). Scroll-aware border/shadow transition. Mobile hamburger button. External link to aeronyx.network. |
| `docs-frontend/components/Sidebar.js` | **Left navigation.** 280px width, sticky on desktop, slide-in drawer on mobile with backdrop. Recursive `CategoryGroup` component renders tree. `categoryContainsSlug()` helper auto-expands categories containing the current article. `ArticleLink` shows active state with purple left border. Route-change listener auto-closes mobile drawer. |
| `docs-frontend/components/SearchModal.js` | **Cmd+K search overlay.** 300ms debounced input. Loading skeleton animation. Keyboard navigation (↑↓ Enter Esc). Selected item auto-scrolls into view. Result count badge. Locks body scroll when open. Platform-aware shortcut hints in footer. |
| `docs-frontend/components/MarkdownRenderer.js` | **Markdown → React renderer.** Custom components for h1–h4 (with hover anchor links), paragraphs, links (external detection), code blocks (language badge + copy button), inline code, blockquotes, lists, tables, images (with figcaption), hr. `extractTOC(markdown)` utility parses headings for table of contents. `extractText()` recursively gets plain text from React children for copy-to-clipboard. |
| **Pages** | |
| `docs-frontend/pages/index.js` | **Homepage.** Hero section with gradient + grid pattern. Recent articles grid (max 6). Category overview cards. Staggered entrance animations. Empty state with icon. `getServerSideProps` fetches tree + articles in parallel. |
| `docs-frontend/pages/[category]/index.js` | **Category page.** Breadcrumb, category title + description + article count badge. Article list with hover effects. Empty state. `getServerSideProps` fetches tree + filtered articles, finds category info from tree via recursive search. |
| `docs-frontend/pages/[category]/[slug].js` | **Article detail page.** Reading progress bar (purple gradient, fixed below header). Breadcrumb. Cover image. Title + meta bar (author, date, reading time estimate, view count). Summary callout box. Full Markdown rendering. Prev/Next article navigation. Right sidebar TOC with IntersectionObserver active heading tracking. 404 state with back link. `getServerSideProps` fetches tree + article, returns `notFound: true` if missing. |
| **Static Assets** | |
| `docs-frontend/public/favicon.svg` | AeroNyx logo in SVG format (purple #7762F3 double-arrow mark). |
