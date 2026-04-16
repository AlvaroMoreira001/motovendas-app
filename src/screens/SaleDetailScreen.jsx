/**
 * src/screens/SaleDetailScreen.jsx
 * Detalhes de uma venda específica com todos os itens
 */

import { View, Text, ScrollView, StyleSheet, StatusBar, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { salesService } from '../services/api'
import { colors, formatCurrency, formatDate, CATEGORIES, PAYMENT_METHODS } from '../constants'
import { LoadingScreen, StatusBadge } from '../components/ui'

export default function SaleDetailScreen({ route, navigation }) {
  const { saleId, justCreated } = route.params

  const { data: sale, isLoading } = useQuery({
    queryKey: ['sale-detail', saleId],
    queryFn: () => salesService.getById(saleId),
  })

  if (isLoading) return <LoadingScreen message="Carregando venda..." />
  if (!sale) return null

  const paymentInfo = PAYMENT_METHODS.find((p) => p.value === sale.paymentMethod)

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Text style={{ color: colors.textMuted, fontSize: 20 }}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Venda #{sale.id.slice(-6).toUpperCase()}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 40 }}>

        {/* Sucesso (se acabou de criar) */}
        {justCreated && (
          <View style={styles.successBanner}>
            <Text style={styles.successIcon}>✅</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.successTitle}>Venda registrada!</Text>
              <Text style={styles.successSub}>O estoque foi atualizado automaticamente.</Text>
            </View>
          </View>
        )}

        {/* Status */}
        <View style={styles.statusRow}>
          <StatusBadge status={sale.status} />
          <Text style={styles.dateText}>{formatDate(sale.createdAt)}</Text>
        </View>

        {/* Resumo */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Resumo</Text>
          <View style={styles.infoGrid}>
            {[
              { label: 'Evento', value: sale.event?.name },
              { label: 'Vendedor', value: sale.seller?.name },
              { label: 'Pagamento', value: paymentInfo ? `${paymentInfo.icon} ${paymentInfo.label}` : sale.paymentMethod || '—' },
              { label: 'Itens', value: `${sale.items?.length || 0} produto(s)` },
            ].map(({ label, value }) => (
              <View key={label} style={styles.infoItem}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue}>{value || '—'}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Itens */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Itens</Text>
          <View style={{ gap: 10 }}>
            {sale.items?.map((item) => {
              const catInfo = CATEGORIES[item.product?.category] || { emoji: '📦' }
              return (
                <View key={item.id} style={styles.saleItem}>
                  <View style={styles.itemEmoji}>
                    <Text style={{ fontSize: 20 }}>{catInfo.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{item.product?.name}</Text>
                    <Text style={styles.itemUnit}>
                      {formatCurrency(item.unitPrice)} por unidade
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.itemQty}>x{item.quantity}</Text>
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
            <Text style={styles.pendingIcon}>⏳</Text>
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
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '800', fontFamily: 'monospace' },
  scroll: { flex: 1 },

  successBanner: {
    backgroundColor: colors.successBg,
    borderWidth: 1,
    borderColor: colors.successBorder,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  successIcon: { fontSize: 28 },
  successTitle: { color: colors.success, fontSize: 15, fontWeight: '700' },
  successSub: { color: colors.success, fontSize: 12, marginTop: 2, opacity: 0.8 },

  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateText: { color: colors.textMuted, fontSize: 13 },

  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  cardTitle: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  infoGrid: { gap: 10 },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: { color: colors.textMuted, fontSize: 13 },
  infoValue: { color: colors.textPrimary, fontSize: 13, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },

  saleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemEmoji: {
    width: 44, height: 44,
    backgroundColor: colors.surface2,
    borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  itemName: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  itemUnit: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  itemQty: { color: colors.textMuted, fontSize: 13, fontWeight: '700' },
  itemSubtotal: { color: colors.brand, fontSize: 15, fontWeight: '800' },

  notesText: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },

  totalCard: {
    backgroundColor: colors.brandBg,
    borderWidth: 1,
    borderColor: colors.brandBorder,
    borderRadius: 14,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLabel: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
  totalValue: { color: colors.brand, fontSize: 30, fontWeight: '900' },

  pendingNote: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  pendingIcon: { fontSize: 20 },
  pendingText: { flex: 1, color: colors.textMuted, fontSize: 13, lineHeight: 18 },
})
