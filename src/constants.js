/**
 * src/constants.js
 * Design tokens e configurações centralizadas
 */

// ── URL do backend ─────────────────────────────────────────
// Troque pela URL do Railway em produção
// Em builds (EAS), prefira configurar via variável de ambiente:
// EXPO_PUBLIC_API_URL=https://seu-backend.com
const envApiUrl = (process.env.EXPO_PUBLIC_API_URL || '').trim()
export const API_URL = (envApiUrl || 'http://192.168.15.166:3000').replace(/\/$/, '')
// ATENÇÃO: Em desenvolvimento, use o IP local da sua máquina
// (não use "localhost" — o celular não consegue acessar)
// Para descobrir seu IP: no terminal, rode "ipconfig" (Windows) ou "ifconfig" (Mac/Linux)

// ── Paleta de cores ───────────────────────────────────────
export const colors = {
  // Fundos
  bg:        '#0a0a0b',
  surface:   '#111113',
  surface2:  '#1a1a1e',
  border:    '#242428',
  border2:   '#3d3d45',

  // Texto
  textPrimary:   '#ffffff',
  textSecondary: '#b8b8c2',
  textMuted:     '#55555f',

  // Brand (laranja)
  brand:         '#ff7c0a',
  brandDark:     '#c74800',
  brandLight:    '#ff9a32',
  brandBg:       'rgba(255,124,10,0.12)',
  brandBorder:   'rgba(255,124,10,0.25)',

  // Status
  success:       '#10b981',
  successBg:     'rgba(16,185,129,0.12)',
  successBorder: 'rgba(16,185,129,0.25)',

  warning:       '#f59e0b',
  warningBg:     'rgba(245,158,11,0.12)',

  error:         '#ef4444',
  errorBg:       'rgba(239,68,68,0.12)',
  errorBorder:   'rgba(239,68,68,0.25)',
}

// ── Categorias de produto ──────────────────────────────────
export const CATEGORIES = {
  capacete: { label: 'Capacete', emoji: '🪖', color: '#ff7c0a' },
  jaqueta:  { label: 'Jaqueta',  emoji: '🧥', color: '#f59e0b' },
  bota:     { label: 'Bota',     emoji: '🥾', color: '#10b981' },
  bone:     { label: 'Boné',     emoji: '🧢', color: '#3b82f6' },
  camisa:   { label: 'Camisa',   emoji: '👕', color: '#8b5cf6' },
}

// ── Formas de pagamento ────────────────────────────────────
export const PAYMENT_METHODS = [
  { value: 'dinheiro', label: 'Dinheiro',  icon: '💵' },
  { value: 'pix',      label: 'Pix',       icon: '📱' },
  { value: 'cartao',   label: 'Cartão',    icon: '💳' },
  { value: 'cortesia', label: 'Cortesia',  icon: '🎁' },
]

// ── Formatações ───────────────────────────────────────────
export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0)
}

export function formatDate(date) {
  if (!date) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(date))
}
