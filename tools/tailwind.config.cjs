/*
 * tailwind.config.cjs — the one Tailwind configuration of the site (brand colours, font, shadows, the extra "xs" breakpoint).
 * Build the stylesheet with `npm run build:css`; see README, "Rebuilding the stylesheet".
 */
module.exports = {
  // every file that can carry a class: the pages and the scripts that add or toggle classes
  content: ['../*.html', '../assets/js/*.js'],
  // classes that scripts build from parts (so the scanner cannot see them whole)
  safelist: ['hidden', '-translate-x-full', 'opacity-60', 'overflow-hidden', 'text-slate-700'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#15803D', dark: '#166534', accent: '#22C55E', tint: '#F0FDF4', soft: '#DCFCE7' },
        page: '#F8FAFC'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif']
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(15 23 42 / 0.05)',
        pop: '0 12px 28px -6px rgb(15 23 42 / 0.18), 0 2px 6px rgb(15 23 42 / 0.06)'
      },
      screens: { xs: '420px' }
    }
  }
};
