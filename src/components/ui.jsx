/**
 * src/components/ui.jsx
 * Componentes base estilizados para React Native
 */

import {
  View, Text, TouchableOpacity, ActivityIndicator,
  StyleSheet, TextInput,
} from 'react-native'
import { colors } from '../constants'

// ── Spinner de loading ─────────────────────────────────────
export function Spinner({ size = 'large', color = colors.brand }) {
  return <ActivityIndicator size={size} color={color} />
}

// ── Tela de loading centralizada ──────────────────────────
export function LoadingScreen({ message = 'Carregando...' }) {
  return (
    <View style={styles.center}>
      <Spinner />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  )
}

// ── Mensagem de erro ──────────────────────────────────────
export function ErrorMessage({ message }) {
  if (!message) return null
  return (
    <View style={styles.errorBox}>
      <Text style={styles.errorText}>{message}</Text>
    </View>
  )
}

// ── Estado vazio ──────────────────────────────────────────
export function EmptyState({ icon, title, description }) {
  return (
    <View style={styles.center}>
      <Text style={{ fontSize: 48, marginBottom: 12 }}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      {description && <Text style={styles.emptyDesc}>{description}</Text>}
    </View>
  )
}

// ── Botão primário ────────────────────────────────────────
export function Button({ label, onPress, disabled, loading, variant = 'primary', style }) {
  const variantStyle = {
    primary: { bg: colors.brand, text: '#fff' },
    ghost:   { bg: colors.surface2, text: colors.textSecondary },
    danger:  { bg: '#dc2626', text: '#fff' },
    success: { bg: '#059669', text: '#fff' },
  }[variant]

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      style={[
        styles.button,
        { backgroundColor: variantStyle.bg },
        (disabled || loading) && { opacity: 0.5 },
        style,
      ]}
    >
      {loading
        ? <Spinner size="small" color={variantStyle.text} />
        : <Text style={[styles.buttonText, { color: variantStyle.text }]}>{label}</Text>
      }
    </TouchableOpacity>
  )
}

// ── Card ──────────────────────────────────────────────────
export function Card({ children, style }) {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  )
}

// ── Badge de status ───────────────────────────────────────
export function StatusBadge({ status }) {
  const map = {
    open:      { label: 'Em aberto',  bg: 'rgba(245,158,11,0.15)',  text: '#f59e0b' },
    completed: { label: 'Finalizada', bg: 'rgba(16,185,129,0.15)',  text: '#10b981' },
    cancelled: { label: 'Cancelada',  bg: 'rgba(239,68,68,0.15)',   text: '#ef4444' },
  }
  const s = map[status] || { label: status, bg: colors.surface2, text: colors.textMuted }
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Text style={[styles.badgeText, { color: s.text }]}>{s.label}</Text>
    </View>
  )
}

// ── Input estilizado ──────────────────────────────────────
export function Input({ label, error, style, ...props }) {
  return (
    <View style={{ marginBottom: 4 }}>
      {label && <Text style={styles.inputLabel}>{label}</Text>}
      <TextInput
        style={[styles.input, error && { borderColor: colors.error }, style]}
        placeholderTextColor={colors.textMuted}
        {...props}
      />
      {error && <Text style={styles.inputError}>{error}</Text>}
    </View>
  )
}

// ── Divider ───────────────────────────────────────────────
export function Divider() {
  return <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 12 }} />
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 8,
  },
  errorBox: {
    backgroundColor: colors.errorBg,
    borderWidth: 1,
    borderColor: colors.errorBorder,
    borderRadius: 10,
    padding: 14,
    marginBottom: 4,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    lineHeight: 18,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyDesc: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 260,
    lineHeight: 18,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    minHeight: 50,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  input: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border2,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.textPrimary,
    fontSize: 15,
  },
  inputLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  inputError: {
    color: colors.error,
    fontSize: 12,
    marginTop: 4,
  },
})
