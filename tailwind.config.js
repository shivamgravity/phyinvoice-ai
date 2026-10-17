/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          app: 'hsl(var(--surface-app) / <alpha-value>)',
          panel: 'hsl(var(--surface-panel) / <alpha-value>)',
        },
        border: {
          panel: 'hsl(var(--border-panel) / <alpha-value>)',
        },
        content: {
          main: 'hsl(var(--content-main) / <alpha-value>)',
          muted: 'hsl(var(--content-muted) / <alpha-value>)',
          inverse: 'hsl(var(--content-inverse) / <alpha-value>)',
        },
        btn: {
          primary: {
            bg: 'hsl(var(--btn-primary-bg) / <alpha-value>)',
            hover: 'hsl(var(--btn-primary-hover) / <alpha-value>)',
            text: 'hsl(var(--btn-primary-text) / <alpha-value>)',
          }
        }
      }
    },
  },
  plugins: [],
}
