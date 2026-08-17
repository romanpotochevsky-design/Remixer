/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Measured from the live Remixer (panel.dreamhost.com/ai-editor), 13 Aug 2026.
        gray: {
          50: '#fafafa', 75: '#f7f7f7', 100: '#f4f4f5', 150: '#f0f0f0',
          200: '#e4e4e7', 300: '#d4d4d8', 350: '#c7c7cd', 400: '#a1a1aa',
          500: '#71717a', 600: '#52525b', 700: '#3f3f46', 750: '#33333a',
          800: '#27272a', 850: '#1f1f22', 900: '#18181b', 950: '#09090b',
        },
        // Action blue. NOTE: the shipping product paints Publish #0073EC (the LIGHT-mode
        // token) inside a dark UI. #1587FF is the defined dark-mode blue — we use it.
        action: { DEFAULT: '#1587ff', hover: '#3d9bff', pressed: '#0073ec' },
        brand: { from: '#9b7bff', to: '#4a2bc3' },
        live: '#48ba79',
        attention: '#e5c359',
        danger: '#ef4444',
      },
      // Brand face first, then the OFL stand-in that ships in the repo, then the
      // system. See the TYPEFACES block at the top of index.css: the licensed
      // Gilroy / Proxima Nova files are not committed, so today the stand-in is
      // what actually renders — the point of naming it here is that every
      // machine renders the SAME thing instead of its own system font.
      fontFamily: {
        sans: ['"Proxima Nova"', 'Figtree', 'system-ui', 'sans-serif'],
        display: ['Gilroy', 'Outfit', '"Proxima Nova"', 'Figtree', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: { shell: '16px', control: '10px', chip: '8px' },
      transitionTimingFunction: { std: 'cubic-bezier(.2,0,0,1)', out: 'cubic-bezier(.4,0,.2,1)' },
    },
  },
  plugins: [],
}
