import React from 'react'
import { View, Text, StyleSheet, ViewProps } from 'react-native'
import { colors, spacing, fontSize, fontWeight } from '../theme/tokens'

type SectionProps = ViewProps & {
  title: string
  hint?: string
}

export function Section({ title, hint, style, children, ...rest }: SectionProps) {
  return (
    <View style={[styles.wrapper, style]} {...rest}>
      <Text style={styles.title}>{title}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: spacing.xl,
    marginHorizontal: spacing.lg,
  },
  title: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.gray500,
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  hint: {
    fontSize: fontSize.sm,
    color: colors.gray400,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
})
