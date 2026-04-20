/**
 * src/components/Icons.jsx
 *
 * Ícones SVG de linha (stroke-only) para o app.
 * Todos 24x24 por padrão, sem preenchimento colorido.
 * Substitui emojis coloridos para visual mais profissional.
 */
import Svg, { Path, Circle, Rect, Line, Polyline, Polygon } from 'react-native-svg'

const defaults = { size: 24, color: '#ffffff', strokeWidth: 1.75 }

function icon(paths) {
  return function Icon({ size = defaults.size, color = defaults.color, strokeWidth = defaults.strokeWidth }) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        {paths({ color, strokeWidth })}
      </Svg>
    )
  }
}

// ── Navegação ────────────────────────────────────────────
export const MenuIcon = icon(() => (
  <>
    <Line x1="3" y1="6" x2="21" y2="6" />
    <Line x1="3" y1="12" x2="21" y2="12" />
    <Line x1="3" y1="18" x2="21" y2="18" />
  </>
))

export const HomeIcon = icon(() => (
  <>
    <Path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
    <Path d="M9 21V12h6v9" />
  </>
))

export const BackIcon = icon(() => (
  <Path d="M15 18l-6-6 6-6" />
))

export const ChevronRight = icon(() => (
  <Path d="M9 18l6-6-6-6" />
))

export const CloseIcon = icon(() => (
  <>
    <Line x1="18" y1="6" x2="6" y2="18" />
    <Line x1="6" y1="6" x2="18" y2="18" />
  </>
))

// ── Ações ────────────────────────────────────────────────
export const SearchIcon = icon(() => (
  <>
    <Circle cx="11" cy="11" r="8" />
    <Line x1="21" y1="21" x2="16.65" y2="16.65" />
  </>
))

export const PlusIcon = icon(() => (
  <>
    <Line x1="12" y1="5" x2="12" y2="19" />
    <Line x1="5" y1="12" x2="19" y2="12" />
  </>
))

export const EditIcon = icon(() => (
  <>
    <Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <Path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </>
))

export const RefreshIcon = icon(() => (
  <>
    <Polyline points="23 4 23 10 17 10" />
    <Path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
  </>
))

export const LogoutIcon = icon(() => (
  <>
    <Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
    <Polyline points="16 17 21 12 16 7" />
    <Line x1="21" y1="12" x2="9" y2="12" />
  </>
))

export const CameraIcon = icon(() => (
  <>
    <Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
    <Circle cx="12" cy="13" r="4" />
  </>
))

export const ImageIcon = icon(() => (
  <>
    <Rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <Circle cx="8.5" cy="8.5" r="1.5" />
    <Polyline points="21 15 16 10 5 21" />
  </>
))

export const TrashIcon = icon(() => (
  <>
    <Polyline points="3 6 5 6 21 6" />
    <Path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
    <Path d="M10 11v6M14 11v6" />
    <Path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
  </>
))

export const MinusIcon = icon(() => (
  <Line x1="5" y1="12" x2="19" y2="12" />
))

export const UploadIcon = icon(() => (
  <>
    <Path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <Polyline points="17 8 12 3 7 8" />
    <Line x1="12" y1="3" x2="12" y2="15" />
  </>
))

// ── Status / Indicadores ────────────────────────────────
export const CheckIcon = icon(() => (
  <Polyline points="20 6 9 17 4 12" />
))

export const AlertIcon = icon(() => (
  <>
    <Path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    <Line x1="12" y1="9" x2="12" y2="13" />
    <Line x1="12" y1="17" x2="12.01" y2="17" />
  </>
))

export const InfoIcon = icon(() => (
  <>
    <Circle cx="12" cy="12" r="10" />
    <Line x1="12" y1="16" x2="12" y2="12" />
    <Line x1="12" y1="8" x2="12.01" y2="8" />
  </>
))

export const StarIcon = icon(() => (
  <Polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
))

// ── Produtos / Estoque ──────────────────────────────────
export const BoxIcon = icon(() => (
  <>
    <Path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
    <Polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <Line x1="12" y1="22.08" x2="12" y2="12" />
  </>
))

export const TagIcon = icon(() => (
  <>
    <Path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
    <Line x1="7" y1="7" x2="7.01" y2="7" />
  </>
))

// ── Categorias (traços, sem cor forte) ──────────────────
export const HelmetIcon = icon(() => (
  // Capacete — forma estilizada
  <>
    <Path d="M12 3C7.03 3 3 7.03 3 12v1a2 2 0 002 2h2v-4a5 5 0 0110 0v4h2a2 2 0 002-2v-1c0-4.97-4.03-9-9-9z" />
    <Path d="M8 15h8v2a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2z" />
  </>
))

export const JacketIcon = icon(() => (
  // Jaqueta — silhueta simplificada
  <>
    <Path d="M3 7l3-4h12l3 4" />
    <Path d="M3 7v13h18V7" />
    <Path d="M9 3v6M15 3v6" />
    <Path d="M9 9h6" />
  </>
))

export const BootIcon = icon(() => (
  // Bota
  <>
    <Path d="M5 20h14v-2H5v2z" />
    <Path d="M8 18V8a4 4 0 018 0v4h2v6" />
  </>
))

export const CapIcon = icon(() => (
  // Boné
  <>
    <Path d="M3 14c0-3.31 4.03-6 9-6s9 2.69 9 6" />
    <Path d="M3 14h18" />
    <Path d="M3 14c0 2 1.5 4 5 4" />
  </>
))

export const ShirtIcon = icon(() => (
  // Camisa
  <>
    <Path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.84H6v10a2 2 0 002 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.57a2 2 0 00-1.34-2.23z" />
  </>
))

// Mapa de categoria → ícone
export const CATEGORY_ICONS = {
  capacete: HelmetIcon,
  jaqueta:  JacketIcon,
  bota:     BootIcon,
  bone:     CapIcon,
  camisa:   ShirtIcon,
}

// ── Vendas / Pagamento ──────────────────────────────────
export const CartIcon = icon(() => (
  <>
    <Circle cx="9" cy="21" r="1" />
    <Circle cx="20" cy="21" r="1" />
    <Path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
  </>
))

export const CashIcon = icon(() => (
  // Dinheiro
  <>
    <Rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <Line x1="1" y1="10" x2="23" y2="10" />
  </>
))

export const PixIcon = icon(() => (
  // Pix — losango estilizado
  <>
    <Path d="M12 3l4 4-4 4-4-4 4-4zM3 12l4 4-4 4-4-4 4-4zM21 12l4 4-4 4-4-4 4-4z" transform="scale(0.8) translate(1.5,1.5)" />
    <Path d="M12 13l4 4-4 4-4-4 4-4z" />
    <Path d="M7 8l-4 4 4 4M17 8l4 4-4 4" />
    <Path d="M7 12h10" />
    <Path d="M12 7v10" />
  </>
))

export const CardIcon = icon(() => (
  <>
    <Rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <Line x1="1" y1="10" x2="23" y2="10" />
    <Line x1="5" y1="15" x2="9" y2="15" />
  </>
))

export const GiftIcon = icon(() => (
  <>
    <Polyline points="20 12 20 22 4 22 4 12" />
    <Rect x="2" y="7" width="20" height="5" />
    <Line x1="12" y1="22" x2="12" y2="7" />
    <Path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" />
    <Path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
  </>
))

// ── Localização / Evento ────────────────────────────────
export const MapPinIcon = icon(() => (
  <>
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
    <Circle cx="12" cy="10" r="3" />
  </>
))

export const CalendarIcon = icon(() => (
  <>
    <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <Line x1="16" y1="2" x2="16" y2="6" />
    <Line x1="8" y1="2" x2="8" y2="6" />
    <Line x1="3" y1="10" x2="21" y2="10" />
  </>
))

export const ZapIcon = icon(() => (
  <Polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
))

// ── Usuário ──────────────────────────────────────────────
export const UserIcon = icon(() => (
  <>
    <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <Circle cx="12" cy="7" r="4" />
  </>
))

export const ShieldIcon = icon(() => (
  <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
))

/** Moto de perfil (logo / marca) */
export const MotoIcon = icon(() => (
  <>
    <Circle cx="6.5" cy="17" r="3" />
    <Circle cx="17.5" cy="17" r="3" />
    <Path d="M6.5 17h3.5l2.5-7h4.5l1.5 7h2" />
    <Path d="M12.5 10l-1.5 7" />
    <Path d="M17 10l2 7" />
  </>
))
