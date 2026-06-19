import React from 'react'
import { colors } from '../theme/tokens'
import {
  Diamond, Settings, Search, X, Check,
  ArrowLeft, ArrowRight, Minus, Plus, RefreshCw,
  AlertTriangle, Clock, Globe, ChevronRight,
  ArrowUp, ArrowDown, MoreHorizontal,
} from 'lucide-react-native'

type IconName =
  | 'diamond' | 'settings' | 'search' | 'close' | 'check'
  | 'back' | 'forward' | 'minus' | 'plus' | 'refresh'
  | 'warning' | 'clock' | 'globe' | 'chevron-right'
  | 'arrow-up' | 'arrow-down' | 'ellipsis'

const iconMap: Record<IconName, React.ComponentType<{size?: number; color?: string}>> = {
  diamond:        Diamond,
  settings:       Settings,
  search:         Search,
  close:          X,
  check:          Check,
  back:           ArrowLeft,
  forward:        ArrowRight,
  minus:          Minus,
  plus:           Plus,
  refresh:        RefreshCw,
  warning:        AlertTriangle,
  clock:          Clock,
  globe:          Globe,
  'chevron-right': ChevronRight,
  'arrow-up':     ArrowUp,
  'arrow-down':   ArrowDown,
  ellipsis:       MoreHorizontal,
}

type IconProps = {
  name: IconName
  size?: number
  color?: string
}

export function Icon({ name, size = 20, color = colors.gray500 }: IconProps) {
  const LucideIcon = iconMap[name]
  return <LucideIcon size={size} color={color} />
}
