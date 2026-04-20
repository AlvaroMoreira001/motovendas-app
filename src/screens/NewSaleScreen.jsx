/**
 * src/screens/NewSaleScreen.jsx
 * Ícones SVG, imagens resolvidas com resolveImageUrl, sem emojis
 */
import { useState, useMemo } from 'react'
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ScrollView, TextInput, Alert, StatusBar, Modal, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productsService, eventsService, salesService } from '../services/api'
import { useCart } from '../context/CartContext'
import { colors, formatCurrency, CATEGORIES, PAYMENT_METHODS, resolveImageUrl } from '../constants'
import { LoadingScreen, Spinner } from '../components/ui'
import {
  BackIcon, SearchIcon, CloseIcon, CartIcon, CheckIcon,
  CATEGORY_ICONS, MinusIcon, PlusIcon,
  CashIcon, CardIcon, GiftIcon,
} from '../components/Icons'

// Ícone de pagamento por tipo
function PaymentIcon({ method, size = 22, color }) {
  const c = color || colors.textMuted
  if (method === 'dinheiro') return <CashIcon size={size} color={c} />
  if (method === 'cartao')   return <CardIcon size={size} color={c} />
  if (method === 'cortesia') return <GiftIcon size={size} color={c} />
  // pix — X estilizado de linhas cruzadas
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: size * 0.65, height: size * 0.65, borderWidth: 1.75, borderColor: c, transform: [{ rotate: '45deg' }], borderRadius: 2 }} />
    </View>
  )
}

function ProductCard({ product, quantity, onAdd, onRemove, stock }) {
  const catInfo  = CATEGORIES[product.category] || { color: colors.brand }
  const CatIcon  = CATEGORY_ICONS[product.category] || BoxIcon
  const noStock  = stock !== undefined && stock <= 0
  const imageUri = resolveImageUrl(product.imageUrl)

  return (
    <View style={[styles.productCard, noStock && styles.productCardDisabled]}>
      {/* Thumb: imagem real ou ícone de categoria */}
      <View style={[styles.productThumb, { backgroundColor: `${catInfo.color}18` }]}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.productThumbImg} onError={() => {}} />
        ) : (
          <CatIcon size={26} color={catInfo.color} strokeWidth={1.5} />
        )}
        {noStock && (
          <View style={styles.esgotadoOverlay}>
            <Text style={styles.esgotadoOverlayText}>ESGOT.</Text>
          </View>
        )}
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
        <Text style={[styles.productCat, { color: catInfo.color }]}>
          {catInfo.label || product.category}
        </Text>
        <Text style={styles.productPrice}>{formatCurrency(product.price)}</Text>
        {stock !== undefined && !noStock && stock <= 3 && (
          <Text style={[styles.stockInfo, { color: colors.warning }]}>
            {stock} restante{stock > 1 ? 's' : ''}
          </Text>
        )}
      </View>

      {/* Controles de quantidade */}
      <View style={styles.qtyControl}>
        {noStock ? (
          <View style={styles.esgotadoBadge}>
            <Text style={styles.esgotadoText}>Esgotado</Text>
          </View>
        ) : quantity > 0 ? (
          <>
            <TouchableOpacity onPress={onRemove} style={styles.qtyBtn} activeOpacity={0.7}>
              <MinusIcon size={14} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.qtyValue}>{quantity}</Text>
            <TouchableOpacity onPress={onAdd} style={[styles.qtyBtn, styles.qtyBtnActive]} activeOpacity={0.7}>
              <PlusIcon size={14} color="#fff" />
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity onPress={onAdd} style={styles.addBtn} activeOpacity={0.7}>
            <PlusIcon size={13} color={colors.brand} />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

function CheckoutModal({ visible, onClose, onConfirm, items, total, loading }) {
  const [paymentMethod, setPaymentMethod] = useState('pix')
  const [notes, setNotes] = useState('')

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <StatusBar barStyle="light-content" />
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
            <CloseIcon size={18} color={colors.textMuted} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Fechar Venda</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 22 }}>
          {/* Itens */}
          <View>
            <Text style={styles.checkoutSection}>Resumo</Text>
            <View style={styles.itemsList}>
              {items.map(item => (
                <View key={item.product.id} style={styles.checkoutItem}>
                  <Text style={styles.checkoutItemName} numberOfLines={1}>{item.product.name}</Text>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.checkoutItemQty}>x{item.quantity}</Text>
                    <Text style={styles.checkoutItemTotal}>
                      {formatCurrency(Number(item.product.price) * item.quantity)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Pagamento */}
          <View>
            <Text style={styles.checkoutSection}>Forma de Pagamento</Text>
            <View style={styles.paymentGrid}>
              {PAYMENT_METHODS.map(method => {
                const isActive = paymentMethod === method.value
                return (
                  <TouchableOpacity
                    key={method.value}
                    onPress={() => setPaymentMethod(method.value)}
                    style={[styles.paymentOption, isActive && styles.paymentOptionActive]}
                    activeOpacity={0.7}
                  >
                    <PaymentIcon
                      method={method.value}
                      size={22}
                      color={isActive ? colors.brand : colors.textMuted}
                    />
                    <Text style={[styles.paymentLabel, isActive && { color: colors.brand }]}>
                      {method.label}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>

          {/* Observações */}
          <View>
            <Text style={styles.checkoutSection}>Observações (opcional)</Text>
            <TextInput
              style={styles.notesInput}
              value={notes} onChangeText={setNotes}
              placeholder="Ex: troco, desconto..."
              placeholderTextColor={colors.textMuted}
              multiline numberOfLines={3}
            />
          </View>
        </ScrollView>

        <View style={styles.checkoutFooter}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
          </View>
          <TouchableOpacity
            style={[styles.confirmBtn, loading && { opacity: 0.6 }]}
            onPress={() => onConfirm({ paymentMethod, notes })}
            disabled={loading} activeOpacity={0.85}
          >
            {loading
              ? <Spinner size="small" color="#fff" />
              : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <CheckIcon size={18} color="#fff" strokeWidth={2.5} />
                  <Text style={styles.confirmBtnText}>Confirmar Venda</Text>
                </View>
              )
            }
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  )
}

export default function NewSaleScreen({ route, navigation }) {
  const { event } = route.params
  const { items, addItem, removeItem, clearCart, total, itemCount } = useCart()
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const qc = useQueryClient()

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products-mobile'],
    queryFn: productsService.list,
  })
  const { data: stockData } = useQuery({
    queryKey: ['event-stock-mobile', event.id],
    queryFn: () => eventsService.getStock(event.id),
    refetchInterval: 30000,
  })

  const stockMap = useMemo(() => {
    const map = {}
    stockData?.stocks?.forEach(s => { map[s.productId] = s.currentQuantity })
    return map
  }, [stockData])

  const createSaleMutation = useMutation({
    mutationFn: salesService.create,
    onSuccess: (sale) => {
      setCheckoutOpen(false); clearCart()
      qc.invalidateQueries(['my-sales-today'])
      navigation.replace('SaleDetail', { saleId: sale.id, justCreated: true })
    },
    onError: (err) => {
      setCheckoutOpen(false)
      Alert.alert('Erro ao registrar venda', err.response?.data?.error || 'Tente novamente.')
    },
  })

  const filtered = products.filter(p =>
    (!search || p.name.toLowerCase().includes(search.toLowerCase())) &&
    (!catFilter || p.category === catFilter)
  )
  const categories = [...new Set(products.map(p => p.category))]
  const getQty = (id) => items.find(i => i.product.id === id)?.quantity || 0

  if (isLoading) return <LoadingScreen message="Carregando produtos..." />

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <BackIcon size={20} color={colors.textMuted} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Nova Venda</Text>
          <Text style={styles.headerSub} numberOfLines={1}>{event.name}</Text>
        </View>
        {itemCount > 0 && (
          <TouchableOpacity style={styles.cartBtn} onPress={() => setCheckoutOpen(true)} activeOpacity={0.8}>
            <CartIcon size={16} color={colors.brand} />
            <Text style={styles.cartBtnText}>{itemCount}</Text>
            <Text style={styles.cartTotal}>{formatCurrency(total)}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Busca */}
      <View style={styles.searchBar}>
        <SearchIcon size={16} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={search} onChangeText={setSearch}
          placeholder="Buscar produto..."
          placeholderTextColor={colors.textMuted}
        />
        {!!search && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <CloseIcon size={15} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filtros categoria */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catFilter}>
        <TouchableOpacity
          onPress={() => setCatFilter('')}
          style={[styles.catChip, !catFilter && styles.catChipActive]}
        >
          <Text style={[styles.catChipText, !catFilter && { color: colors.brand }]}>Todos</Text>
        </TouchableOpacity>
        {categories.map(cat => {
          const info = CATEGORIES[cat]
          const CatIcon = CATEGORY_ICONS[cat]
          const isActive = catFilter === cat
          return (
            <TouchableOpacity
              key={cat}
              onPress={() => setCatFilter(catFilter === cat ? '' : cat)}
              style={[styles.catChip, isActive && styles.catChipActive]}
            >
              {CatIcon && <CatIcon size={14} color={isActive ? colors.brand : colors.textMuted} strokeWidth={1.75} />}
              <Text style={[styles.catChipText, isActive && { color: colors.brand }]}>
                {' '}{info?.label || cat}
              </Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={p => p.id}
        contentContainerStyle={styles.productList}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: product }) => (
          <ProductCard
            product={product}
            quantity={getQty(product.id)}
            stock={stockMap[product.id]}
            onAdd={() => addItem(product)}
            onRemove={() => removeItem(product.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyProducts}>
            <SearchIcon size={40} color={colors.border2} />
            <Text style={{ color: colors.textMuted, fontSize: 14, marginTop: 12 }}>
              Nenhum produto encontrado
            </Text>
          </View>
        }
      />

      {/* Carrinho flutuante */}
      {itemCount > 0 && (
        <TouchableOpacity style={styles.floatingCart} onPress={() => setCheckoutOpen(true)} activeOpacity={0.9}>
          <View style={styles.floatingCartLeft}>
            <View style={styles.floatingCartBadge}>
              <Text style={styles.floatingCartBadgeText}>{itemCount}</Text>
            </View>
            <Text style={styles.floatingCartLabel}>Fechar venda</Text>
          </View>
          <Text style={styles.floatingCartTotal}>{formatCurrency(total)}</Text>
        </TouchableOpacity>
      )}

      <CheckoutModal
        visible={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onConfirm={p => createSaleMutation.mutate({
          eventId: event.id, ...p,
          items: items.map(i => ({ productId: i.product.id, quantity: i.quantity })),
        })}
        items={items} total={total} loading={createSaleMutation.isPending}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderRadius: 10, borderWidth: 1, borderColor: colors.border },
  headerTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '800' },
  headerSub:   { color: colors.textMuted, fontSize: 12 },
  cartBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.brandBorder, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  cartBtnText: { color: colors.brand, fontSize: 14, fontWeight: '700' },
  cartTotal:   { color: colors.textMuted, fontSize: 11 },
  searchBar:  { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, marginHorizontal: 16, marginBottom: 10, paddingHorizontal: 14, height: 46 },
  searchInput:{ flex: 1, color: colors.textPrimary, fontSize: 15 },
  catFilter:  { paddingHorizontal: 16, paddingBottom: 12, paddingTop: 2, gap: 8, alignItems: 'center' },
  catChip:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, minHeight: 38 },
  catChipActive: { backgroundColor: colors.brandBg, borderColor: colors.brandBorder },
  catChipText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  productList: { paddingHorizontal: 16, paddingBottom: 100, gap: 10 },
  productCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 13 },
  productCardDisabled: { opacity: 0.38 },
  productThumb: { width: 56, height: 56, borderRadius: 12, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative', flexShrink: 0 },
  productThumbImg: { width: '100%', height: '100%', borderRadius: 12 },
  esgotadoOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(239,68,68,0.85)', paddingVertical: 2, alignItems: 'center' },
  esgotadoOverlayText: { color: '#fff', fontSize: 7, fontWeight: '900', letterSpacing: 0.5 },
  productName:  { color: colors.textPrimary, fontSize: 13, fontWeight: '700', marginBottom: 2 },
  productCat:   { fontSize: 11, fontWeight: '600', textTransform: 'capitalize', marginBottom: 3 },
  productPrice: { color: colors.brand, fontSize: 15, fontWeight: '900' },
  stockInfo:    { fontSize: 11, marginTop: 3 },
  qtyControl:   { alignItems: 'center', gap: 6 },
  qtyBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border2, alignItems: 'center', justifyContent: 'center' },
  qtyBtnActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  qtyValue:  { color: colors.textPrimary, fontSize: 18, fontWeight: '800', minWidth: 26, textAlign: 'center' },
  addBtn:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.brandBg, borderWidth: 1, borderColor: colors.brandBorder, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  addBtnText:{ color: colors.brand, fontSize: 12, fontWeight: '700' },
  esgotadoBadge: { backgroundColor: colors.errorBg, borderWidth: 1, borderColor: colors.errorBorder, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6 },
  esgotadoText:  { color: colors.error, fontSize: 11, fontWeight: '700' },
  emptyProducts: { alignItems: 'center', paddingTop: 50 },
  floatingCart: { position: 'absolute', bottom: 24, left: 20, right: 20, backgroundColor: colors.brand, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: colors.brand, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 10 },
  floatingCartLeft:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  floatingCartBadge:   { backgroundColor: 'rgba(0,0,0,0.25)', width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  floatingCartBadgeText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  floatingCartLabel: { color: '#fff', fontSize: 16, fontWeight: '700' },
  floatingCartTotal: { color: '#fff', fontSize: 18, fontWeight: '900' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalCloseBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderRadius: 10 },
  modalTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '800' },
  checkoutSection: { color: colors.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 },
  itemsList: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, overflow: 'hidden' },
  checkoutItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 12 },
  checkoutItemName:  { flex: 1, color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  checkoutItemQty:   { color: colors.textMuted, fontSize: 12 },
  checkoutItemTotal: { color: colors.brand, fontSize: 15, fontWeight: '800' },
  paymentGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  paymentOption: { flex: 1, minWidth: '44%', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, alignItems: 'center', gap: 8 },
  paymentOptionActive: { borderColor: colors.brandBorder, backgroundColor: colors.brandBg },
  paymentLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  notesInput: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, color: colors.textPrimary, fontSize: 14, minHeight: 80, textAlignVertical: 'top' },
  checkoutFooter: { padding: 20, borderTopWidth: 1, borderTopColor: colors.border, gap: 14 },
  totalRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { color: colors.textMuted, fontSize: 16, fontWeight: '600' },
  totalValue: { color: colors.textPrimary, fontSize: 28, fontWeight: '900' },
  confirmBtn: { backgroundColor: colors.brand, borderRadius: 14, paddingVertical: 18, alignItems: 'center', shadowColor: colors.brand, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6 },
  confirmBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
})
