import React from 'react'
import { View, ViewProps, StyleSheet } from 'react-native'
import { colors, radii, spacing } from '../theme/tokens'

type CardProps = ViewProps & {
  padded?: boolean
}

export function Card({ padded = true, style, children, ...rest }: CardProps) {
  return (
    <View style={[styles.card, padded && styles.padded, style]} {...rest}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  padded: {
    padding: spacing.lg,
  },
})
