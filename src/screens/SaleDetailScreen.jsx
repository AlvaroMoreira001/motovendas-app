/**
 * src/screens/SaleDetailScreen.jsx
 * Sem emojis — ícones SVG, imagens resolvidas
 */
import { View, Text, ScrollView, StyleSheet, StatusBar, TouchableOpacity, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { salesService } from '../services/api'
import { colors, formatCurrency, formatDate, CATEGORIES, PAYMENT_METHODS, resolveImageUrl } from '../constants'
import { LoadingScreen, StatusBadge } from '../components/ui'
import {
  BackIcon, CheckIcon, AlertIcon, BoxIcon,
  MapPinIcon, CalendarIcon, UserIcon, CartIcon,
  CashIcon, CardIcon, GiftIcon, CATEGORY_ICONS,
} from '../components/Icons'

function PaymentIcon({ method, size = 18, color }) {
  const c = color || colors.textMuted
  if (method === 'dinheiro') return <CashIcon size={size} color={c} />
  if (method === 'cartao')   return <CardIcon size={size} color={c} />
  if (method === 'cortesia') return <GiftIcon size={size} color={c} />
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: size * 0.65, height: size * 0.65, borderWidth: 1.75, borderColor: c, transform: [{ rotate: '45deg' }], borderRadius: 2 }} />
    </View>
  )
}

export default function SaleDetailScreen({ route, navigation }) {
  const { saleId, justCreated } = route.params

  const { data: sale, isLoading } = useQuery({
    queryKey: ['sale-detail', saleId],
    queryFn: () => salesService.getById(saleId),
  })

  if (isLoading) return <LoadingScreen message="Carregando venda..." />
  if (!sale) return null

  const paymentInfo = PAYMENT_METHODS.find(p => p.value === sale.paymentMethod)

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <BackIcon size={20} color={colors.textMuted} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>#{sale.id.slice(-6).toUpperCase()}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 40 }}>

        {/* Banner de sucesso */}
        {justCreated && (
          <View style={styles.successBanner}>
            <CheckIcon size={24} color={colors.success} strokeWidth={2.5} />
            <View style={{ flex: 1 }}>
              <Text style={styles.successTitle}>Venda registrada!</Text>
              <Text style={styles.successSub}>O estoque foi atualizado automaticamente.</Text>
            </View>
          </View>
        )}

        {/* Status + data */}
        <View style={styles.statusRow}>
          <StatusBadge status={sale.status} />
          <Text style={styles.dateText}>{formatDate(sale.createdAt)}</Text>
        </View>

        {/* Resumo */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Resumo</Text>
          <View style={styles.infoGrid}>
            {[
              { Icon: CalendarIcon, label: 'Evento',    value: sale.event?.name },
              { Icon: UserIcon,     label: 'Vendedor',  value: sale.seller?.name },
              { Icon: null,         label: 'Pagamento', value: paymentInfo?.label || sale.paymentMethod || '—', payment: sale.paymentMethod },
              { Icon: CartIcon,     label: 'Itens',     value: `${sale.items?.length || 0} produto(s)` },
            ].map(({ Icon, label, value, payment }) => (
              <View key={label} style={styles.infoItem}>
                <Text style={styles.infoLabel}>{label}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: '62%' }}>
                  {payment && <PaymentIcon method={payment} size={14} color={colors.textSecondary} />}
                  {Icon && !payment && <Icon size={13} color={colors.textMuted} />}
                  <Text style={styles.infoValue} numberOfLines={1}>{value || '—'}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Itens */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Itens</Text>
          <View style={{ gap: 10 }}>
            {sale.items?.map(item => {
              const catInfo = CATEGORIES[item.product?.category] || { color: colors.brand }
              const CatIcon = CATEGORY_ICONS[item.product?.category]
              const imgUri  = resolveImageUrl(item.product?.imageUrl)
              return (
                <View key={item.id} style={styles.saleItem}>
                  <View style={[styles.itemThumb, { backgroundColor: `${catInfo.color}18` }]}>
                    {imgUri ? (
                      <Image source={{ uri: imgUri }} style={styles.itemThumbImg} onError={() => {}} />
                    ) : CatIcon ? (
                      <CatIcon size={22} color={catInfo.color} strokeWidth={1.5} />
                    ) : (
                      <BoxIcon size={22} color={catInfo.color} strokeWidth={1.5} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName} numberOfLines={2}>{item.product?.name}</Text>
                    <Text style={styles.itemUnit}>{formatCurrency(item.unitPrice)} por unidade</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.itemQty}>×{item.quantity}</Text>
                    <Text style={styles.itemSubtotal}>{formatCurrency(item.subtotal)}</Text>
                  </View>
                </View>
              )
            })}
          </View>
        </View>

        {/* Observações */}
        {sale.notes && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Observações</Text>
            <Text style={styles.notesText}>{sale.notes}</Text>
          </View>
        )}

        {/* Total */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total da Venda</Text>
          <Text style={styles.totalValue}>{formatCurrency(sale.total)}</Text>
        </View>

        {/* Status pendente */}
        {sale.status === 'open' && (
          <View style={styles.pendingNote}>
            <AlertIcon size={18} color={colors.warning} />
            <Text style={styles.pendingText}>
              Esta venda está aguardando confirmação pelo administrador no portal web.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn:{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderRadius: 10, borderWidth: 1, borderColor: colors.border },
  headerTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '800', fontFamily: 'monospace' },
  scroll: { flex: 1 },
  successBanner: { backgroundColor: colors.successBg, borderWidth: 1, borderColor: colors.successBorder, borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  successTitle: { color: colors.success, fontSize: 15, fontWeight: '700' },
  successSub:   { color: colors.success, fontSize: 12, marginTop: 2, opacity: 0.85 },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateText:  { color: colors.textMuted, fontSize: 13 },
  card:      { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 16, gap: 12 },
  cardTitle: { color: colors.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5 },
  infoGrid:  { gap: 10 },
  infoItem:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  infoLabel: { color: colors.textMuted, fontSize: 13 },
  infoValue: { color: colors.textPrimary, fontSize: 13, fontWeight: '600', textAlign: 'right' },
  saleItem:  { flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  itemThumb: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  itemThumbImg: { width: '100%', height: '100%', borderRadius: 10 },
  itemName:  { color: colors.textPrimary, fontSize: 13, fontWeight: '600' },
  itemUnit:  { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  itemQty:   { color: colors.textMuted, fontSize: 13, fontWeight: '700' },
  itemSubtotal: { color: colors.brand, fontSize: 15, fontWeight: '800' },
  notesText: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  totalCard: { backgroundColor: colors.brandBg, borderWidth: 1, borderColor: colors.brandBorder, borderRadius: 14, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalLabel:{ color: colors.textMuted, fontSize: 14, fontWeight: '600' },
  totalValue:{ color: colors.brand, fontSize: 30, fontWeight: '900' },
  pendingNote:{ backgroundColor: colors.warningBg, borderWidth: 1, borderColor: colors.warningBorder, borderRadius: 14, padding: 16, flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  pendingText:{ flex: 1, color: colors.textMuted, fontSize: 13, lineHeight: 18 },
})
