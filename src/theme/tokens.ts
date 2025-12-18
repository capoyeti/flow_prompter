// Design tokens for the application
// These should be the only source of truth for colors, spacing, etc.

export const colors = {
  // Semantic colors
  background: {
    primary: 'var(--background)',
    secondary: 'var(--color-neutral-50)',
    tertiary: 'var(--color-neutral-100)',
    inverse: 'var(--foreground)',
  },
  foreground: {
    primary: 'var(--foreground)',
    secondary: 'var(--color-neutral-600)',
    muted: 'var(--color-neutral-400)',
    inverse: 'var(--background)',
  },
  border: {
    default: 'var(--color-neutral-200)',
    subtle: 'var(--color-neutral-100)',
    strong: 'var(--color-neutral-300)',
  },
  accent: {
    primary: 'var(--color-blue-500)',
    primaryHover: 'var(--color-blue-600)',
    secondary: 'var(--color-purple-500)',
    success: 'var(--color-green-500)',
    warning: 'var(--color-amber-500)',
    error: 'var(--color-red-500)',
  },
  // Provider-specific colors
  provider: {
    openai: 'var(--color-green-600)',
    anthropic: 'var(--color-orange-500)',
    google: 'var(--color-blue-500)',
  },
} as const;

export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
} as const;

export const borderRadius = {
  sm: '0.25rem',   // 4px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px
  full: '9999px',
} as const;

export const fontSize = {
  xs: '0.75rem',   // 12px
  sm: '0.875rem',  // 14px
  base: '1rem',    // 16px
  lg: '1.125rem',  // 18px
  xl: '1.25rem',   // 20px
  '2xl': '1.5rem', // 24px
} as const;

export const fontWeight = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
} as const;

export const transitions = {
  fast: '150ms ease',
  normal: '200ms ease',
  slow: '300ms ease',
} as const;
