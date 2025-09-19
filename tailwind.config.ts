import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'mono': ['Berkeley Mono', 'JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Consolas', 'monospace'],
      },
      colors: {
        'primary-green': '#5AFD81',
        'primary-red': '#F8343D',
        'primary-yellow': '#E7F40F',
        'bg-main': '#000000',
        'bg-secondary': '#040D0A',
        'bg-other': '#060606',
        'table-item-bg': '#1F1F05',
        'table-item-fg': '#848D11',
        'table-title-alt': '#041A43',
        'accent': '#BC8D25',
        'box-outline': '#1A1A1A',
        'box-bg': '#060606',
        'box-title-bg': '#CA8F31',
        'box-header-bg': '#130F04',
        'table-text': '#808080',
        'highlight-text': '#CA8F31',
        'highlight-bg': '#212107',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'terminal-scan': 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 0, 0.03) 2px, rgba(0, 255, 0, 0.03) 4px)',
      },
      animation: {
        'blink': 'blink 1s infinite',
        'scan': 'scan 2s linear infinite',
      },
      keyframes: {
        blink: {
          '0%, 50%': { opacity: '1' },
          '51%, 100%': { opacity: '0' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        }
      }
    },
  },
  plugins: [],
}
export default config
