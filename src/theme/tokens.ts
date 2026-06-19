export const colors = {
  primary:       '#3b82f6',
  primaryLight:  '#93c5fd',
  primaryBg:     '#eff6ff',

  success:       '#16a34a',
  successLight:  '#22c55e',
  successBg:     '#f0fdf4',

  warning:       '#f59e0b',

  error:         '#ef4444',

  gray900:       '#111827',
  gray700:       '#374151',
  gray500:       '#6b7280',
  gray400:       '#9ca3af',
  gray300:       '#d1d5db',
  gray200:       '#e5e7eb',
  gray100:       '#f3f4f6',
  gray50:        '#f9fafb',

  white:         '#fff',
  overlay:       'rgba(0,0,0,0.4)',
} as const

export const spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  24,
  xxxl: 32,
} as const

export const radii = {
  sm:   8,
  md:   10,
  lg:   12,
  xl:   16,
  full: 999,
} as const

export const fontSize = {
  xs:   11,
  sm:   12,
  base: 13,
  md:   14,
  lg:   15,
  xl:   16,
  xxl:  17,
  title: 20,
} as const

export const fontWeight = {
  normal:  '400' as const,
  medium:  '500' as const,
  semibold: '600' as const,
  bold:    '700' as const,
}

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  md: {
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  lg: {
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
} as const
