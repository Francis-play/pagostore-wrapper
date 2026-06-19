import React from 'react'
import {
  TouchableOpacity, Text, StyleSheet, ActivityIndicator,
  TouchableOpacityProps,
} from 'react-native'
import { colors, radii, spacing, fontSize, fontWeight } from '../theme/tokens'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'

type ButtonProps = TouchableOpacityProps & {
  variant?: ButtonVariant
  loading?: boolean
  title: string
}

const variantStyles: Record<ButtonVariant, { bg: string; text: string; disabledBg: string }> = {
  primary:   { bg: colors.primary,   text: colors.white,    disabledBg: colors.primaryLight },
  secondary: { bg: colors.gray100,   text: colors.gray700,  disabledBg: colors.gray200 },
  danger:    { bg: colors.error,     text: colors.white,    disabledBg: '#fca5a5' },
  ghost:     { bg: 'transparent',    text: colors.primary,  disabledBg: 'transparent' },
}

export function Button({
  variant = 'primary',
  loading,
  disabled,
  title,
  style,
  ...rest
}: ButtonProps) {
  const v = variantStyles[variant]
  const isDisabled = disabled || loading

  return (
    <TouchableOpacity
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[
        styles.base,
        { backgroundColor: isDisabled ? v.disabledBg : v.bg },
        variant === 'ghost' && styles.ghost,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={v.text} size="small" />
      ) : (
        <Text style={[styles.text, { color: v.text }]}>{title}</Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.md,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  ghost: {
    paddingVertical: spacing.sm,
  },
  text: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
})
