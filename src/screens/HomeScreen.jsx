/**
 * src/screens/HomeScreen.jsx
 * Sem emojis — ícones SVG de linha
 */
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, StatusBar, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { eventsService, salesService } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { colors, formatCurrency, formatDate } from '../constants'
import { StatusBadge, LoadingScreen } from '../components/ui'
import { HamburgerButton } from '../navigation/HamburgerButton'
import {
  MapPinIcon, CalendarIcon, ZapIcon,
  CartIcon, LogoutIcon, CheckIcon,
} from '../components/Icons'

export default function HomeScreen({ navigation, drawerNavigation }) {
  const { user, logout } = useAuth()

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

  const today = new Date().toDateString()
  const todaySales = mySales.filter(
    s => new Date(s.createdAt).toDateString() === today && s.status !== 'cancelled'
  )
  const todayTotal = todaySales.reduce((sum, s) => sum + Number(s.total || 0), 0)

  if (loadingEvent) return <LoadingScreen message="Buscando evento ativo..." />

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <HamburgerButton navigation={drawerNavigation} />
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>Olá, {user?.name?.split(' ')[0]}</Text>
          <Text style={styles.greetingSub}>Pronto para vender?</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn} hitSlop={{ top:8, bottom:8, left:8, right:8 }}>
          <LogoutIcon size={17} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch}
            tintColor={colors.brand} colors={[colors.brand]} />
        }
      >
        {/* Evento ativo */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Evento Ativo</Text>
          {!activeEvent ? (
            <View style={styles.noEvent}>
              <BoxIconPlaceholder />
              <Text style={styles.noEventTitle}>Nenhum evento ativo</Text>
              <Text style={styles.noEventSub}>Aguarde o administrador ativar um evento.</Text>
            </View>
          ) : (
            <View style={styles.eventCard}>
              <View style={styles.eventDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.eventName}>{activeEvent.name}</Text>
                {activeEvent.location && (
                  <View style={styles.eventMeta}>
                    <MapPinIcon size={12} color={colors.textMuted} />
                    <Text style={styles.eventMetaText}>{activeEvent.location}</Text>
                  </View>
                )}
                {activeEvent.eventDate && (
                  <View style={styles.eventMeta}>
                    <CalendarIcon size={12} color={colors.textMuted} />
                    <Text style={styles.eventMetaText}>
                      {new Date(activeEvent.eventDate).toLocaleDateString('pt-BR')}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.activeBadge}>
                <ZapIcon size={10} color={colors.success} strokeWidth={2.5} />
                <Text style={styles.activeBadgeText}>AO VIVO</Text>
              </View>
            </View>
          )}
        </View>

        {/* KPIs */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Meu Desempenho Hoje</Text>
          <View style={styles.kpiRow}>
            <View style={[styles.kpiCard, { flex: 1 }]}>
              <Text style={styles.kpiValue}>{todaySales.length}</Text>
              <Text style={styles.kpiLabel}>Vendas</Text>
            </View>
            <View style={[styles.kpiCard, styles.kpiCardAccent, { flex: 2 }]}>
              <Text style={[styles.kpiValue, { color: colors.brand }]}>{formatCurrency(todayTotal)}</Text>
              <Text style={styles.kpiLabel}>Total vendido hoje</Text>
            </View>
          </View>
        </View>

        {/* Botão nova venda */}
        {activeEvent && (
          <TouchableOpacity
            style={styles.newSaleBtn}
            onPress={() => navigation.navigate('NewSale', { event: activeEvent })}
            activeOpacity={0.85}
          >
            <View style={styles.newSaleIcon}>
              <CartIcon size={26} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.newSaleBtnTitle}>Nova Venda</Text>
              <Text style={styles.newSaleBtnSub}>Selecionar produtos e fechar venda</Text>
            </View>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 22 }}>›</Text>
          </TouchableOpacity>
        )}

        {/* Últimas vendas */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Últimas Vendas de Hoje</Text>
          {loadingSales ? null : todaySales.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>Nenhuma venda registrada hoje ainda.</Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {todaySales.slice(0, 5).map(sale => (
                <TouchableOpacity
                  key={sale.id}
                  style={styles.saleItem}
                  onPress={() => navigation.navigate('SaleDetail', { saleId: sale.id })}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.saleId}>#{sale.id.slice(-6).toUpperCase()}</Text>
                    <Text style={styles.saleTime}>{formatDate(sale.createdAt)}</Text>
                    {sale.paymentMethod && (
                      <Text style={styles.salePayment} numberOfLines={1}>{sale.paymentMethod}</Text>
                    )}
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <Text style={styles.saleTotal}>{formatCurrency(sale.total)}</Text>
                    <StatusBadge status={sale.status} />
                  </View>
                </TouchableOpacity>
              ))}
              {todaySales.length > 5 && (
                <TouchableOpacity onPress={() => drawerNavigation?.navigate('MySales')} style={styles.seeAllBtn}>
                  <Text style={styles.seeAllText}>Ver todas as {todaySales.length} vendas</Text>
                  <Text style={{ color: colors.brand }}> →</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function BoxIconPlaceholder() {
  return <View style={{ width: 40, height: 40, marginBottom: 10 }} />
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: colors.bg },
  header:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 14, gap: 10 },
  greeting:   { color: colors.textPrimary, fontSize: 20, fontWeight: '800' },
  greetingSub:{ color: colors.textMuted, fontSize: 12, marginTop: 1 },
  logoutBtn:  { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderRadius: 10, borderWidth: 1, borderColor: colors.border },
  scroll:     { flex: 1, paddingHorizontal: 20 },
  section:    { marginBottom: 24 },
  sectionLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 },
  noEvent:    { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 28, alignItems: 'center' },
  noEventTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
  noEventSub: { color: colors.textMuted, fontSize: 13, marginTop: 4, textAlign: 'center' },
  eventCard:  { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.successBorder, borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  eventDot:   { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.success },
  eventName:  { color: colors.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 4 },
  eventMeta:  { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  eventMetaText: { color: colors.textMuted, fontSize: 12 },
  activeBadge:{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.successBg, borderWidth: 1, borderColor: colors.successBorder, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 5 },
  activeBadgeText: { color: colors.success, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  kpiRow:     { flexDirection: 'row', gap: 10 },
  kpiCard:    { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 16 },
  kpiCardAccent: { borderColor: colors.brandBorder, backgroundColor: colors.brandBg },
  kpiValue:   { color: colors.textPrimary, fontSize: 26, fontWeight: '900', marginBottom: 2 },
  kpiLabel:   { color: colors.textMuted, fontSize: 12 },
  newSaleBtn: { backgroundColor: colors.brand, borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 24, shadowColor: colors.brand, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 8 },
  newSaleIcon:{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  newSaleBtnTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
  newSaleBtnSub:   { color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 2 },
  emptyBox:   { backgroundColor: colors.surface, borderRadius: 12, padding: 20, alignItems: 'center' },
  emptyText:  { color: colors.textMuted, fontSize: 13 },
  saleItem:   { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  saleId:     { color: colors.textPrimary, fontSize: 14, fontWeight: '700', fontFamily: 'monospace' },
  saleTime:   { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  salePayment:{ color: colors.textMuted, fontSize: 12, marginTop: 2, textTransform: 'capitalize' },
  saleTotal:  { color: colors.brand, fontSize: 16, fontWeight: '800' },
  seeAllBtn:  { paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  seeAllText: { color: colors.textMuted, fontSize: 14 },
})
