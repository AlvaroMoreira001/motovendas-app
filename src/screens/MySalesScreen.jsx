/**
 * src/screens/MySalesScreen.jsx
 * Histórico completo de vendas do vendedor logado
 */

import { useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { salesService } from '../services/api'
import { colors, formatCurrency, formatDate } from '../constants'
import { LoadingScreen, StatusBadge, EmptyState } from '../components/ui'
import { CartIcon } from '../components/Icons'
import { HamburgerButton } from '../navigation/HamburgerButton'

const STATUS_FILTERS = [
  { value: '', label: 'Todas' },
  { value: 'open', label: 'Em aberto' },
  { value: 'completed', label: 'Finalizadas' },
  { value: 'cancelled', label: 'Canceladas' },
]

export default function MySalesScreen({ navigation, drawerNavigation }) {
  const [statusFilter, setStatusFilter] = useState('')

  const { data: sales = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['my-sales', statusFilter],
    queryFn: () => salesService.listMy(statusFilter ? { status: statusFilter } : {}),
    refetchInterval: 20000,
  })

  const totalRevenue = sales
    .filter((s) => s.status !== 'cancelled')
    .reduce((sum, s) => sum + Number(s.total || 0), 0)

  const renderItem = ({ item: sale }) => (
    <TouchableOpacity
      style={styles.saleCard}
      onPress={() => navigation.navigate('SaleDetail', { saleId: sale.id })}
      activeOpacity={0.75}
    >
      <View style={styles.saleTop}>
        <Text style={styles.saleId}>#{sale.id.slice(-6).toUpperCase()}</Text>
        <StatusBadge status={sale.status} />
      </View>

      <View style={styles.saleMiddle}>
        <View>
          <Text style={styles.saleEvent}>{sale.event?.name}</Text>
          <Text style={styles.saleDate}>{formatDate(sale.createdAt)}</Text>
          {sale.paymentMethod && (
            <Text style={styles.salePayment}>{sale.paymentMethod}</Text>
          )}
        </View>
        <Text style={styles.saleTotal}>{formatCurrency(sale.total)}</Text>
      </View>

      {sale.items?.length > 0 && (
        <View style={styles.saleItems}>
          {sale.items.slice(0, 3).map((item) => (
            <Text key={item.id} style={styles.saleItemText} numberOfLines={1}>
              • {item.product?.name} x{item.quantity}
            </Text>
          ))}
          {sale.items.length > 3 && (
            <Text style={styles.saleItemMore}>+ {sale.items.length - 3} item(s)</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  )

  if (isLoading) return <LoadingScreen message="Carregando vendas..." />

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <HamburgerButton navigation={drawerNavigation} />
        <Text style={styles.headerTitle}>Minhas Vendas</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Resumo */}
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{sales.length}</Text>
          <Text style={styles.summaryLabel}>Vendas</Text>
        </View>
        <View style={[styles.summaryItem, styles.summaryAccent]}>
          <Text style={[styles.summaryValue, { color: colors.brand }]}>
            {formatCurrency(totalRevenue)}
          </Text>
          <Text style={styles.summaryLabel}>Total (sem canceladas)</Text>
        </View>
      </View>

      {/* Filtro por status */}
      <View style={styles.filterRow}>
        {STATUS_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.value}
            onPress={() => setStatusFilter(f.value)}
            style={[styles.filterChip, statusFilter === f.value && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, statusFilter === f.value && { color: colors.brand }]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={sales}
        keyExtractor={(s) => s.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onRefresh={refetch}
        refreshing={isRefetching}
        ListEmptyComponent={
          <EmptyState
            icon={<CartIcon size={48} color={colors.textMuted} />}
            title="Nenhuma venda encontrada"
            description="Suas vendas aparecerão aqui após serem registradas."
          />
        }
      />
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
  headerTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '800' },

  summary: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  summaryItem: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
  },
  summaryAccent: {
    flex: 2,
    borderColor: colors.brandBorder,
    backgroundColor: colors.brandBg,
  },
  summaryValue: { color: colors.textPrimary, fontSize: 22, fontWeight: '900' },
  summaryLabel: { color: colors.textMuted, fontSize: 12, marginTop: 2 },

  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.brandBg,
    borderColor: colors.brandBorder,
  },
  filterChipText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },

  list: { paddingHorizontal: 16, gap: 10, paddingBottom: 32 },
  saleCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  saleTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  saleId: { color: colors.textPrimary, fontSize: 15, fontWeight: '800', fontFamily: 'monospace' },
  saleMiddle: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  saleEvent: { color: colors.textPrimary, fontSize: 13, fontWeight: '600', marginBottom: 2 },
  saleDate: { color: colors.textMuted, fontSize: 12 },
  salePayment: { color: colors.textMuted, fontSize: 12, marginTop: 2, textTransform: 'capitalize' },
  saleTotal: { color: colors.brand, fontSize: 20, fontWeight: '900' },
  saleItems: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    gap: 3,
  },
  saleItemText: { color: colors.textMuted, fontSize: 12 },
  saleItemMore: { color: colors.brand, fontSize: 12, fontWeight: '600', marginTop: 2 },
})
