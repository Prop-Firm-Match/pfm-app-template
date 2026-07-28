// Trimmed vendored copy of propfirm's packages/tailwind/tailwind.config.ts —
// same token names/mapping, campaign fonts (black-friday/cyber-monday/christmas)
// and seasonal color groups (valentines/holiday/awards) dropped since this is
// a lean internal-tool template, not the marketing site.
import type { Config } from 'tailwindcss';
import animatePlugin from 'tailwindcss-animate';
import typography from '@tailwindcss/typography';
import colors from 'tailwindcss/colors';
import { fontFamily } from 'tailwindcss/defaultTheme';

const shadCnColors = {
  border: {
    DEFAULT: 'hsl(var(--border))',
    secondary: 'hsl(var(--border-secondary))',
  },
  input: 'hsl(var(--input))',
  ring: 'hsl(var(--ring))',
  background: {
    DEFAULT: 'hsl(var(--background))',
    primary: 'hsl(var(--background-primary))',
    secondary: 'hsl(var(--background-secondary))',
    tertiary: 'hsl(var(--background-tertiary))',
  },
  foreground: {
    DEFAULT: 'hsl(var(--foreground))',
    secondary: 'hsl(var(--foreground-secondary))',
    tertiary: 'hsl(var(--foreground-tertiary))',
    disabled: 'hsl(var(--foreground-disabled))',
  },
  primary: {
    DEFAULT: 'hsl(var(--primary))',
    theme: 'hsl(var(--primary-theme))',
    'theme-foreground': 'hsl(var(--primary-theme-foreground))',
    hover: 'hsl(var(--primary-hover))',
    focus: 'hsl(var(--primary-focus))',
    foreground: 'hsl(var(--primary-foreground))',
  },
  dark: {
    DEFAULT: 'hsl(var(--dark))',
    hover: 'hsl(var(--dark-hover))',
    focus: 'hsl(var(--dark-focus))',
    disabled: 'hsl(var(--dark-disabled))',
  },
  green: {
    DEFAULT: 'hsl(var(--green))',
    theme: 'hsl(var(--green-theme))',
    hover: 'hsl(var(--green-hover))',
    focus: 'hsl(var(--green-focus))',
    foreground: 'hsl(var(--green-foreground))',
  },
  red: {
    DEFAULT: 'hsl(var(--red))',
    theme: 'hsl(var(--red-theme))',
    hover: 'hsl(var(--red-hover))',
    focus: 'hsl(var(--red-focus))',
    foreground: 'hsl(var(--red-foreground))',
  },
  yellow: {
    DEFAULT: 'hsl(var(--yellow))',
    foreground: 'hsl(var(--yellow-foreground))',
  },
  purple: {
    DEFAULT: 'hsl(var(--purple))',
    theme: 'hsl(var(--purple-theme))',
    hover: 'hsl(var(--purple-hover))',
    foreground: 'hsl(var(--purple-foreground))',
  },
  blue: {
    DEFAULT: 'hsl(var(--blue))',
    theme: 'hsl(var(--blue-theme))',
    foreground: 'hsl(var(--blue-foreground))',
  },
  muted: {
    DEFAULT: 'hsl(var(--muted))',
    foreground: 'hsl(var(--muted-foreground))',
  },
  accent: {
    DEFAULT: 'hsl(var(--accent))',
    foreground: 'hsl(var(--accent-foreground))',
  },
  popover: {
    DEFAULT: 'hsl(var(--popover))',
    foreground: 'hsl(var(--popover-foreground))',
  },
  card: {
    DEFAULT: 'hsl(var(--card))',
    foreground: 'hsl(var(--card-foreground))',
  },
};

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    colors: {
      transparent: colors.transparent,
      white: colors.white,
      black: colors.black,
      current: colors.current,
      ...shadCnColors,
    },
    extend: {
      backgroundImage: {
        'pfm-gradient': 'var(--pfm-gradient)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', ...fontFamily.sans],
        serif: ['var(--font-serif)', ...fontFamily.serif],
      },
      screens: {
        xs: '425px',
        '2xl': '1440px',
      },
    },
  },
  plugins: [animatePlugin, typography],
} satisfies Config;
