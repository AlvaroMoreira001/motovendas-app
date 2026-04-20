/**
 * src/constants.js
 * Design tokens e configurações centralizadas
 */

// ── URL do backend ─────────────────────────────────────────
export const API_URL = 'http://192.168.1.100:3000'
// ATENÇÃO: Em desenvolvimento, use o IP local da sua máquina
// (não use "localhost" — o celular não consegue acessar)
// Para descobrir seu IP: no terminal, rode "ipconfig" (Windows) ou "ifconfig" (Mac/Linux)

/**
 * Reescreve a URL de imagem que veio do banco para usar
 * o API_URL configurado no app, em vez de localhost/IP do servidor.
 *
 * Isso resolve o caso onde a imagem foi salva com URL do portal web
 * (http://localhost:3000/... ou http://192.168.x.x:3000/...)
 * mas o celular usa um IP diferente para acessar o backend.
 */
export function resolveImageUrl(imageUrl) {
  if (!imageUrl) return null
  // Se já é uma URL externa (https://...), usa direto
  if (imageUrl.startsWith('https://')) return imageUrl
  // Se contém /uploads/products/, extrai só o path e monta com API_URL
  const match = imageUrl.match(/\/uploads\/products\/(.+)$/)
  if (match) return `${API_URL}/uploads/products/${match[1]}`
  // Fallback: URL como veio
  return imageUrl
}

// ── Paleta de cores ───────────────────────────────────────
export const colors = {
  bg:        '#0a0a0b',
  surface:   '#111113',
  surface2:  '#1a1a1e',
  border:    '#242428',
  border2:   '#3d3d45',

  textPrimary:   '#ffffff',
  textSecondary: '#b8b8c2',
  textMuted:     '#55555f',

  brand:         '#ff7c0a',
  brandDark:     '#c74800',
  brandLight:    '#ff9a32',
  brandBg:       'rgba(255,124,10,0.12)',
  brandBorder:   'rgba(255,124,10,0.25)',

  success:       '#10b981',
  successBg:     'rgba(16,185,129,0.12)',
  successBorder: 'rgba(16,185,129,0.25)',

  warning:       '#f59e0b',
  warningBg:     'rgba(245,158,11,0.12)',
  warningBorder: 'rgba(245,158,11,0.25)',

  error:         '#ef4444',
  errorBg:       'rgba(239,68,68,0.12)',
  errorBorder:   'rgba(239,68,68,0.25)',
}

// ── Categorias (sem emojis — ícones são importados de Icons.jsx) ─
export const CATEGORIES = {
  capacete: { label: 'Capacete', color: '#ff7c0a' },
  jaqueta:  { label: 'Jaqueta',  color: '#f59e0b' },
  bota:     { label: 'Bota',     color: '#10b981' },
  bone:     { label: 'Boné',     color: '#3b82f6' },
  camisa:   { label: 'Camisa',   color: '#8b5cf6' },
}

// ── Formas de pagamento (sem emojis — ícones em Icons.jsx) ─
export const PAYMENT_METHODS = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'pix',      label: 'Pix'      },
  { value: 'cartao',   label: 'Cartão'   },
  { value: 'cortesia', label: 'Cortesia' },
]

export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL',
  }).format(value || 0)
}

export function formatDate(date) {
  if (!date) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(date))
}
