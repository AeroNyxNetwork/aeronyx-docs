/**
 * ============================================
 * File: docs-frontend/components/MarkdownRenderer.js
 * ============================================
 * Creation Reason: Render article Markdown content with syntax highlighting
 * Modification Reason: v1.0.1 - Fixed react-markdown v9 `inline` prop
 *   removal (BUG: code component received undefined `inline` prop).
 *   Now detects inline vs block code via `node` context.
 *   Added language badge on code blocks. Improved copy button UX.
 *
 * Main Functionality:
 *   - react-markdown with remark-gfm (tables, strikethrough, etc.)
 *   - rehype-highlight for code syntax highlighting
 *   - rehype-slug for heading anchor IDs
 *   - Custom components for links, images, code blocks
 *   - Language badge display on fenced code blocks
 *   - Table of Contents extraction utility
 *
 * Dependencies:
 *   - react-markdown v9+, remark-gfm, rehype-highlight, rehype-slug
 *   - highlight.js (theme loaded in globals.css)
 *   - lucide-react (Copy, Check icons)
 *
 * ⚠️ Important Note for Next Developer:
 * - react-markdown v9 removed `inline` prop from code component
 * - Detect inline code by checking if parent node is NOT <pre>
 * - className on code block contains language: "language-javascript" etc.
 * - External links automatically get target="_blank"
 *
 * Last Modified: v1.0.1 - inline code fix + language badge + UX improvements
 * ============================================
 */

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import { Copy, Check, Link as LinkIcon } from 'lucide-react';
import { useState, useCallback, useRef } from 'react';

// ============================================
// Table of Contents Extractor
// ============================================

/**
 * Extract headings from markdown string for TOC
 * @param {string} markdown - raw markdown content
 * @returns {Array<{ level: number, text: string, id: string }>}
 */
export function extractTOC(markdown) {
  if (!markdown) return [];

  const headingRegex = /^(#{1,4})\s+(.+)$/gm;
  const toc = [];
  let match;

  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    const text = match[2]
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove markdown links
      .replace(/[*_`~\[\]]/g, '')               // Remove formatting chars
      .trim();

    // Generate slug matching rehype-slug output
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    if (level >= 2 && level <= 4) {
      toc.push({ level, text, id });
    }
  }

  return toc;
}

// ============================================
// Extract language from className
// ============================================

function extractLanguage(className) {
  if (!className) return null;
  const match = className.match(/language-(\w+)/);
  return match ? match[1] : null;
}

// ============================================
// Copy Button for Code Blocks
// ============================================

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2.5 right-2.5 p-1.5 rounded-md
        bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06]
        transition-all opacity-0 group-hover:opacity-100
        focus:opacity-100"
      title={copied ? 'Copied!' : 'Copy code'}
      aria-label={copied ? 'Copied to clipboard' : 'Copy code to clipboard'}
    >
      {copied ? (
        <Check size={13} className="text-green-400" />
      ) : (
        <Copy size={13} className="text-white/30" />
      )}
    </button>
  );
}

// ============================================
// Recursive text content extractor
// ============================================

function extractText(children) {
  if (typeof children === 'string') return children;
  if (Array.isArray(children)) return children.map(extractText).join('');
  if (children?.props?.children) return extractText(children.props.children);
  return '';
}

// ============================================
// Custom Markdown Components
// ============================================

const components = {
  // Headings
  h1: ({ children, id, ...props }) => (
    <h1 id={id} className="text-[1.875rem] font-semibold mt-12 mb-5 text-white/95 leading-tight" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, id, ...props }) => (
    <h2
      id={id}
      className="text-[1.5rem] font-semibold mt-10 mb-4 text-white/90 pb-2.5 border-b border-white/[0.06] leading-tight group"
      {...props}
    >
      {children}
      <a href={`#${id}`} className="ml-2 opacity-0 group-hover:opacity-40 transition-opacity text-primary" aria-label="Link to heading">
        <LinkIcon size={16} className="inline" />
      </a>
    </h2>
  ),
  h3: ({ children, id, ...props }) => (
    <h3 id={id} className="text-[1.25rem] font-medium mt-8 mb-3 text-white/85 leading-snug group" {...props}>
      {children}
      <a href={`#${id}`} className="ml-2 opacity-0 group-hover:opacity-30 transition-opacity text-primary" aria-label="Link to heading">
        <LinkIcon size={14} className="inline" />
      </a>
    </h3>
  ),
  h4: ({ children, id, ...props }) => (
    <h4 id={id} className="text-[1.1rem] font-medium mt-6 mb-2 text-white/80 leading-snug" {...props}>
      {children}
    </h4>
  ),

  // Paragraphs
  p: ({ children, ...props }) => (
    <p className="text-[15px] leading-[1.8] text-white/65 mb-4" {...props}>
      {children}
    </p>
  ),

  // Links — external links open in new tab
  a: ({ href, children, ...props }) => {
    const isExternal = href && (href.startsWith('http') || href.startsWith('//'));
    return (
      <a
        href={href}
        className="text-primary hover:text-primary-300 underline decoration-primary/30 underline-offset-2 hover:decoration-primary/60 transition-colors"
        {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        {...props}
      >
        {children}
      </a>
    );
  },

  // Code blocks with copy button + language badge
  pre: ({ children, ...props }) => {
    // Extract text for copy and language from child <code>
    const codeChild = children?.props;
    const textContent = codeChild?.children ? extractText(codeChild.children) : '';
    const lang = extractLanguage(codeChild?.className);

    return (
      <div className="relative group my-5">
        {lang && (
          <span className="code-lang-badge">{lang}</span>
        )}
        <pre
          className="bg-black/50 border border-white/[0.06] rounded-xl p-5 overflow-x-auto text-[13px] leading-[1.7]"
          {...props}
        >
          {children}
        </pre>
        {textContent && <CopyButton text={textContent} />}
      </div>
    );
  },

  // Code: inline vs block
  // BUG FIX (v1.0.1): react-markdown v9 removed `inline` prop.
  // We detect inline by checking if `node.position` parent is not <pre>.
  // Simpler heuristic: if className contains "language-*", it's a block code inside <pre>.
  code: ({ children, className, node, ...props }) => {
    // If className has language-*, this is inside a <pre> block (handled by pre component)
    const isBlock = Boolean(className && /language-/.test(className));

    if (!isBlock) {
      return (
        <code
          className="bg-primary/[0.08] border border-primary/[0.1] rounded-[4px] px-[5px] py-[2px] text-[0.85em] font-mono text-primary-200"
          {...props}
        >
          {children}
        </code>
      );
    }

    // Block code — rendered as-is inside <pre>
    return (
      <code className={`font-mono text-[13px] ${className || ''}`} {...props}>
        {children}
      </code>
    );
  },

  // Blockquotes
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="border-l-3 border-primary bg-primary/[0.03] rounded-r-xl px-5 py-3.5 my-5"
      {...props}
    >
      {children}
    </blockquote>
  ),

  // Lists
  ul: ({ children, ...props }) => (
    <ul className="list-disc list-outside ml-5 mb-5 space-y-1.5 text-[15px] text-white/65" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="list-decimal list-outside ml-5 mb-5 space-y-1.5 text-[15px] text-white/65" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="leading-[1.75] pl-1" {...props}>
      {children}
    </li>
  ),

  // Tables
  table: ({ children, ...props }) => (
    <div className="overflow-x-auto my-5 rounded-xl border border-white/[0.06]">
      <table className="w-full text-sm" {...props}>
        {children}
      </table>
    </div>
  ),
  th: ({ children, ...props }) => (
    <th
      className="bg-white/[0.02] px-4 py-2.5 text-left text-[11px] uppercase tracking-wider text-white/40 font-semibold border-b border-white/[0.06]"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="px-4 py-2.5 text-white/55 border-b border-white/[0.04] text-[13px]" {...props}>
      {children}
    </td>
  ),

  // Horizontal rule
  hr: (props) => <hr className="border-white/[0.06] my-10" {...props} />,

  // Images with figcaption
  img: ({ src, alt, ...props }) => (
    <figure className="my-6">
      <img
        src={src}
        alt={alt || ''}
        className="rounded-xl max-w-full border border-white/[0.06]"
        loading="lazy"
        {...props}
      />
      {alt && alt !== '' && (
        <figcaption className="text-[11px] text-white/25 text-center mt-2.5 italic">
          {alt}
        </figcaption>
      )}
    </figure>
  ),
};

// ============================================
// Main Renderer Component
// ============================================

export default function MarkdownRenderer({ content }) {
  if (!content) {
    return (
      <div className="text-white/20 text-center py-16 text-sm">
        No content available.
      </div>
    );
  }

  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeSlug]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
