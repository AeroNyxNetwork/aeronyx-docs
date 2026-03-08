/**
 * ============================================
 * tailwind.config.js - Tailwind CSS Configuration
 * ============================================
 * Creation Reason: Match AeroNyx brand design system
 * Main Functionality:
 *   - Custom color palette (purple primary #7762F3)
 *   - Typography plugin for markdown rendering
 *   - Dark mode as default
 *
 * Last Modified: v1.0.0 - Initial creation
 * ============================================
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#7762F3',
          50: '#f0edfe',
          100: '#e0dafd',
          200: '#c1b5fb',
          300: '#a290f8',
          400: '#836bf6',
          500: '#7762F3',
          600: '#5f4ec2',
          700: '#473b92',
          800: '#302761',
          900: '#181431',
        },
        surface: {
          DEFAULT: '#0a0a0a',
          50: '#171717',
          100: '#1a1a1a',
          200: '#262626',
          300: '#333333',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      typography: () => ({
        invert: {
          css: {
            '--tw-prose-body': 'rgba(255,255,255,0.7)',
            '--tw-prose-headings': 'rgba(255,255,255,0.95)',
            '--tw-prose-links': '#7762F3',
            '--tw-prose-bold': 'rgba(255,255,255,0.9)',
            '--tw-prose-counters': 'rgba(255,255,255,0.5)',
            '--tw-prose-bullets': 'rgba(255,255,255,0.3)',
            '--tw-prose-hr': 'rgba(255,255,255,0.1)',
            '--tw-prose-quotes': 'rgba(255,255,255,0.6)',
            '--tw-prose-quote-borders': '#7762F3',
            '--tw-prose-code': '#c1b5fb',
            '--tw-prose-pre-code': 'rgba(255,255,255,0.8)',
            '--tw-prose-pre-bg': 'rgba(0,0,0,0.5)',
            '--tw-prose-th-borders': 'rgba(255,255,255,0.15)',
            '--tw-prose-td-borders': 'rgba(255,255,255,0.08)',
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
