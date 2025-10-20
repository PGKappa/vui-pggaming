import type { Config } from 'tailwindcss'
import tailwindCssAnimate from 'tailwindcss-animate'

export default {
  darkMode: ['class'],
  safelist: ['default', 'sportradar', 'dp', 'sc', 'retail-default'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/retail-components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '0rem',
    },
    extend: {
      fontFamily: {
        sans: ['Arial', 'sans-serif'],
        inter: ['var(--font-inter)', 'sans-serif'],
      },
      fontSize: {
        sm: '0.75rem',
        md: '1rem',
        lg: '1.125rem',
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        columnL: {
          background: 'hsl(var(--columnL-background))',
          foreground: 'hsl(var(--columnL-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
          header: {
            DEFAULT: 'hsl(var(--card-header))',
            foreground: 'hsl(var(--card-header-foreground))',
          },
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        tertiary: {
          DEFAULT: 'hsl(var(--tertiary))',
          foreground: 'hsl(var(--tertiary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        table: {
          DEFAULT: 'hsl(var(--table-foreground))',
        },
        badge: {
          DEFAULT: 'hsl(var(--badge-background))',
          foreground: 'hsl(var(--badge-foreground))',
        },
        betEntry: {
          DEFAULT: 'hsl(var(--betEntry-background))',
          foreground: 'hsl(var(--betEntry-foreground))',
          border: 'hsl(var(--betEntry-border))',
        },
        navbarButton: {
          DEFAULT: 'hsl(var(--navbarButton))',
          foreground: 'hsl(var(--navbarButton-foreground))',
          selected: {
            DEFAULT: 'hsl(var(--navbarButton-selected))',
            foreground: 'hsl(var(--navbarButton-selected-foreground))',
          },
        },
        market: {
          DEFAULT: 'hsl(var(--market))',
          foreground: 'hsl(var(--market-foreground))',
          selected: {
            DEFAULT: 'hsl(var(--market-selected))',
            foreground: 'hsl(var(--market-selected-foreground))',
          },
        },
        searchResult: {
          DEFAULT: 'hsl(var(--searchResult))',
          foreground: 'hsl(var(--searchResult-foreground))',
          secondary: 'hsl(var(--searchResult-secondary))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        bet: {
          DEFAULT: 'hsl(var(--bet))',
          foreground: 'hsl(var(--bet-foreground))',
        },
        betSlip: {
          DEFAULT: 'hsl(var(--betSlip))',
          foreground: 'hsl(var(--betSlip-foreground))',
          header: {
            DEFAULT: 'hsl(var(--betSlip-header))',
            foreground: 'hsl(var(--betSlip-header-foreground))',
          },
        },
        betHistory: {
          DEFAULT: 'hsl(var(--betHistory))',
          foreground: 'hsl(var(--betHistory-foreground))',
          header: 'hsl(var(--betHistory-header))',
        },
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        footer: {
          ranking: {
            DEFAULT: 'hsl(var(--footer-ranking))',
            foreground: 'hsl(var(--footer-ranking-foreground))',
          },
          betslip: {
            DEFAULT: 'hsl(var(--footer-betslip))',
            foreground: 'hsl(var(--footer-betslip-foreground))',
          },
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [tailwindCssAnimate],
} satisfies Config
