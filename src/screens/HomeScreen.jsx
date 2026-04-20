/**
 * src/screens/HomeScreen.jsx
 *
 * Tela inicial do vendedor.
 * Mostra o evento ativo, resumo do dia e acesso rápido para nova venda.
 */

import { View, Text, TouchableOpacity, ScrollView, StyleSheet, StatusBar, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { eventsService, salesService } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { colors, formatCurrency, formatDate } from '../constants'
import { StatusBadge, LoadingScreen, EmptyState } from '../components/ui'

export default function HomeScreen({ navigation, drawerNav }) {
  const { user, logout } = useAuth()
  const nav = drawerNav || navigation

  const { data: activeEvent, isLoading: loadingEvent, refetch, isRefetching } = useQuery({
    queryKey: ['active-event'],
    queryFn: eventsService.getActive,
    refetchInterval: 30000,
  })

  const { data: mySales = [], isLoading: loadingSales } = useQuery({
    queryKey: ['my-sales-today'],
    queryFn: () => salesService.listMy({ status: undefined }),
    refetchInterval: 20000,
  })

  // Vendas do dia de hoje
  const today = new Date().toDateString()
  const todaySales = mySales.filter(
    (s) => new Date(s.createdAt).toDateString() === today && s.status !== 'cancelled'
  )
  const todayTotal = todaySales.reduce((sum, s) => sum + Number(s.total || 0), 0)

  const handleLogout = async () => { await logout() }

  if (loadingEvent) return <LoadingScreen message="Buscando evento ativo..." />

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, {user?.name?.split(' ')[0]} 👋</Text>
          <Text style={styles.greetingSub}>Pronto para vender?</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={{ color: colors.textMuted, fontSize: 13 }}>Sair</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.brand}
            colors={[colors.brand]}
          />
        }
      >
        {/* Card do evento ativo */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Evento Ativo</Text>

          {!activeEvent ? (
            <View style={styles.noEvent}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>📭</Text>
              <Text style={styles.noEventTitle}>Nenhum evento ativo</Text>
              <Text style={styles.noEventSub}>
                Aguarde o administrador ativar um evento.
              </Text>
            </View>
          ) : (
            <View style={styles.eventCard}>
              <View style={styles.eventDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.eventName}>{activeEvent.name}</Text>
                {activeEvent.location && (
                  <Text style={styles.eventLocation}>📍 {activeEvent.location}</Text>
                )}
                {activeEvent.eventDate && (
                  <Text style={styles.eventLocation}>
                    📅 {new Date(activeEvent.eventDate).toLocaleDateString('pt-BR')}
                  </Text>
                )}
              </View>
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>AO VIVO</Text>
              </View>
            </View>
          )}
        </View>

        {/* KPIs do dia */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Meu Desempenho Hoje</Text>
          <View style={styles.kpiRow}>
            <View style={[styles.kpiCard, { flex: 1 }]}>
              <Text style={styles.kpiValue}>{todaySales.length}</Text>
              <Text style={styles.kpiLabel}>Vendas</Text>
            </View>
            <View style={[styles.kpiCard, styles.kpiCardAccent, { flex: 2 }]}>
              <Text style={[styles.kpiValue, { color: colors.brand }]}>
                {formatCurrency(todayTotal)}
              </Text>
              <Text style={styles.kpiLabel}>Total vendido hoje</Text>
            </View>
          </View>
        </View>

        {/* Botão principal — Nova Venda */}
        {activeEvent && (
          <TouchableOpacity
            style={styles.newSaleBtn}
            onPress={() => navigation.navigate('NewSale', { event: activeEvent })}
            activeOpacity={0.85}
          >
            <Text style={styles.newSaleBtnIcon}>🛒</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.newSaleBtnTitle}>Nova Venda</Text>
              <Text style={styles.newSaleBtnSub}>Selecionar produtos e fechar venda</Text>
            </View>
            <Text style={{ color: colors.brand, fontSize: 22 }}>›</Text>
          </TouchableOpacity>
        )}

        {/* Últimas vendas do dia */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Últimas Vendas de Hoje</Text>

          {loadingSales ? null : todaySales.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>Nenhuma venda registrada hoje ainda.</Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {todaySales.slice(0, 5).map((sale) => (
                <TouchableOpacity
                  key={sale.id}
                  style={styles.saleItem}
                  onPress={() => navigation.navigate('SaleDetail', { saleId: sale.id })}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.saleId}>#{sale.id.slice(-6).toUpperCase()}</Text>
                    <Text style={styles.saleTime}>{formatDate(sale.createdAt)}</Text>
                    <Text style={styles.salePayment}>
                      {sale.paymentMethod || 'Pagamento não informado'}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <Text style={styles.saleTotal}>{formatCurrency(sale.total)}</Text>
                    <StatusBadge status={sale.status} />
                  </View>
                </TouchableOpacity>
              ))}

              {todaySales.length > 5 && (
                <TouchableOpacity
                  onPress={() => navigation.navigate('MySales')}
                  style={styles.seeAllBtn}
                >
                  <Text style={styles.seeAllText}>
                    Ver todas as {todaySales.length} vendas →
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  greeting: { color: colors.textPrimary, fontSize: 22, fontWeight: '800' },
  greetingSub: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  logoutBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  scroll: { flex: 1, paddingHorizontal: 20 },
  section: { marginBottom: 24 },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 10,
  },

  // Evento
  noEvent: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
  },
  noEventTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  noEventSub: { color: colors.textMuted, fontSize: 13, marginTop: 4, textAlign: 'center' },
  eventCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.successBorder,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  eventDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
  },
  eventName: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 2 },
  eventLocation: { color: colors.textMuted, fontSize: 12, marginTop: 1 },
  activeBadge: {
    backgroundColor: colors.successBg,
    borderWidth: 1,
    borderColor: colors.successBorder,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  activeBadgeText: { color: colors.success, fontSize: 10, fontWeight: '800', letterSpacing: 1 },

  // KPIs
  kpiRow: { flexDirection: 'row', gap: 10 },
  kpiCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
  },
  kpiCardAccent: {
    borderColor: colors.brandBorder,
    backgroundColor: colors.brandBg,
  },
  kpiValue: { color: colors.textPrimary, fontSize: 26, fontWeight: '900', marginBottom: 2 },
  kpiLabel: { color: colors.textMuted, fontSize: 12 },

  // Botão nova venda
  newSaleBtn: {
    backgroundColor: colors.brand,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 24,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  newSaleBtnIcon: { fontSize: 28 },
  newSaleBtnTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  newSaleBtnSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },

  // Lista de vendas
  emptyBox: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  emptyText: { color: colors.textMuted, fontSize: 13 },
  saleItem: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  saleId: { color: colors.textPrimary, fontSize: 14, fontWeight: '700', fontFamily: 'monospace' },
  saleTime: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  salePayment: { color: colors.textMuted, fontSize: 12, marginTop: 2, textTransform: 'capitalize' },
  saleTotal: { color: colors.brand, fontSize: 16, fontWeight: '800' },
  seeAllBtn: { paddingVertical: 12, alignItems: 'center' },
  seeAllText: { color: colors.brand, fontSize: 14, fontWeight: '600' },
})
