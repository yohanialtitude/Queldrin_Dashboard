const token = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

export default {
  darkMode: 'class',
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      colors: {
        bg: token('bg'),
        surface: token('surface'),
        muted: token('muted'),
        line: token('line'),
        ink: token('ink'),
        'ink-soft': token('ink-soft'),
        brand: token('brand'),
        'brand-fg': token('brand-fg'),
        accent: token('accent'),
        'accent-soft': token('accent-soft'),
        success: token('success'),
        warning: token('warning'),
        danger: token('danger'),
        info: token('info'),
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        google: ['Roboto', 'Arial', 'sans-serif'],
      },
    },
  },
};
