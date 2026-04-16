import { useState, useMemo } from 'react'
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ScrollView, TextInput, Alert, StatusBar, Modal } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productsService, eventsService, salesService } from '../services/api'
import { useCart } from '../context/CartContext'
import { colors, formatCurrency, CATEGORIES, PAYMENT_METHODS } from '../constants'
import { LoadingScreen, Spinner } from '../components/ui'

function ProductCard({ product, quantity, onAdd, onRemove, stock }) {
  const catInfo = CATEGORIES[product.category] || { emoji:'📦', color:colors.brand }
  const noStock = stock !== undefined && stock <= 0

  return (
    <View style={[styles.productCard, noStock && styles.productCardDisabled]}>
      <View style={[styles.productEmoji, {backgroundColor:`${catInfo.color}20`}]}>
        <Text style={{fontSize:28}}>{catInfo.emoji}</Text>
      </View>
      <View style={{flex:1}}>
        <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
        <Text style={[styles.productCat,{color:catInfo.color}]}>{catInfo.label||product.category}</Text>
        <Text style={styles.productPrice}>{formatCurrency(product.price)}</Text>
        {stock !== undefined && (
          <Text style={[styles.stockInfo, stock<=2&&stock>0&&{color:colors.warning}, noStock&&{color:colors.error}]}>
            {noStock ? '❌ Esgotado' : stock<=2 ? `⚠️ Apenas ${stock} restante(s)` : `📦 ${stock} disponíveis`}
          </Text>
        )}
      </View>
      <View style={styles.qtyControl}>
        {noStock ? (
          <View style={styles.esgotadoBadge}>
            <Text style={styles.esgotadoText}>Esgotado</Text>
          </View>
        ) : quantity > 0 ? (
          <>
            <TouchableOpacity onPress={onRemove} style={styles.qtyBtn} activeOpacity={0.7}>
              <Text style={styles.qtyBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.qtyValue}>{quantity}</Text>
            <TouchableOpacity onPress={onAdd} style={[styles.qtyBtn,styles.qtyBtnActive]} activeOpacity={0.7}>
              <Text style={[styles.qtyBtnText,{color:'#fff'}]}>+</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity onPress={onAdd} style={styles.addBtn} activeOpacity={0.7}>
            <Text style={styles.addBtnText}>+ Adicionar</Text>
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
      <SafeAreaView style={{flex:1,backgroundColor:colors.bg}}>
        <StatusBar barStyle="light-content" />
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}><Text style={{color:colors.textMuted,fontSize:16}}>✕ Voltar</Text></TouchableOpacity>
          <Text style={styles.modalTitle}>Fechar Venda</Text>
          <View style={{width:70}}/>
        </View>
        <ScrollView style={{flex:1}} contentContainerStyle={{padding:20,gap:20}}>
          <View>
            <Text style={styles.checkoutSection}>Itens</Text>
            <View style={styles.itemsList}>
              {items.map(item => (
                <View key={item.product.id} style={styles.checkoutItem}>
                  <Text style={styles.checkoutItemName} numberOfLines={1}>
                    {CATEGORIES[item.product.category]?.emoji} {item.product.name}
                  </Text>
                  <View style={{alignItems:'flex-end'}}>
                    <Text style={styles.checkoutItemQty}>x{item.quantity}</Text>
                    <Text style={styles.checkoutItemTotal}>{formatCurrency(Number(item.product.price)*item.quantity)}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
          <View>
            <Text style={styles.checkoutSection}>Forma de Pagamento</Text>
            <View style={styles.paymentGrid}>
              {PAYMENT_METHODS.map(method => (
                <TouchableOpacity key={method.value} onPress={()=>setPaymentMethod(method.value)}
                  style={[styles.paymentOption, paymentMethod===method.value&&styles.paymentOptionActive]} activeOpacity={0.7}>
                  <Text style={{fontSize:22}}>{method.icon}</Text>
                  <Text style={[styles.paymentLabel, paymentMethod===method.value&&{color:colors.brand}]}>{method.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View>
            <Text style={styles.checkoutSection}>Observações (opcional)</Text>
            <TextInput style={styles.notesInput} value={notes} onChangeText={setNotes}
              placeholder="Ex: troco, desconto..." placeholderTextColor={colors.textMuted} multiline numberOfLines={3}/>
          </View>
        </ScrollView>
        <View style={styles.checkoutFooter}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
          </View>
          <TouchableOpacity style={[styles.confirmBtn,loading&&{opacity:0.6}]} onPress={()=>onConfirm({paymentMethod,notes})} disabled={loading} activeOpacity={0.85}>
            {loading ? <Spinner size="small" color="#fff"/> : <Text style={styles.confirmBtnText}>✓  Confirmar Venda</Text>}
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

  const { data: products = [], isLoading } = useQuery({ queryKey:['products-mobile'], queryFn:productsService.list })
  const { data: stockData } = useQuery({ queryKey:['event-stock-mobile',event.id], queryFn:()=>eventsService.getStock(event.id), refetchInterval:30000 })

  const stockMap = useMemo(() => {
    const map = {}
    stockData?.stocks?.forEach(s => { map[s.productId] = s.currentQuantity })
    return map
  }, [stockData])

  const createSaleMutation = useMutation({
    mutationFn: salesService.create,
    onSuccess: (sale) => { setCheckoutOpen(false); clearCart(); qc.invalidateQueries(['my-sales-today']); navigation.replace('SaleDetail', { saleId:sale.id, justCreated:true }) },
    onError: (err) => { setCheckoutOpen(false); Alert.alert('Erro ao registrar venda', err.response?.data?.error||'Tente novamente.') },
  })

  const filtered = products.filter(p => (!search||p.name.toLowerCase().includes(search.toLowerCase())) && (!catFilter||p.category===catFilter))
  const categories = [...new Set(products.map(p=>p.category))]
  const getQty = (productId) => items.find(i=>i.product.id===productId)?.quantity||0

  if (isLoading) return <LoadingScreen message="Carregando produtos..." />

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <View style={styles.header}>
        <TouchableOpacity onPress={()=>navigation.goBack()} style={styles.backBtn}>
          <Text style={{color:colors.textMuted,fontSize:20}}>‹</Text>
        </TouchableOpacity>
        <View style={{flex:1}}>
          <Text style={styles.headerTitle}>Nova Venda</Text>
          <Text style={styles.headerSub}>{event.name}</Text>
        </View>
        {itemCount > 0 && (
          <TouchableOpacity style={styles.cartBtn} onPress={()=>setCheckoutOpen(true)} activeOpacity={0.8}>
            <Text style={styles.cartBtnText}>🛒 {itemCount}</Text>
            <Text style={styles.cartTotal}>{formatCurrency(total)}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.searchBar}>
        <Text style={{color:colors.textMuted,fontSize:16,marginRight:8}}>🔍</Text>
        <TextInput style={styles.searchInput} value={search} onChangeText={setSearch} placeholder="Buscar produto..." placeholderTextColor={colors.textMuted}/>
        {search ? <TouchableOpacity onPress={()=>setSearch('')}><Text style={{color:colors.textMuted,fontSize:18,paddingLeft:8}}>✕</Text></TouchableOpacity> : null}
      </View>

      {/* Filtro de categoria — chips sem cortar ícone */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catFilter}>
        <TouchableOpacity onPress={()=>setCatFilter('')} style={[styles.catChip,!catFilter&&styles.catChipActive]}>
          <Text style={[styles.catChipText,!catFilter&&{color:colors.brand}]}>Todos</Text>
        </TouchableOpacity>
        {categories.map(cat => {
          const info = CATEGORIES[cat]
          return (
            <TouchableOpacity key={cat} onPress={()=>setCatFilter(catFilter===cat?'':cat)}
              style={[styles.catChip,catFilter===cat&&styles.catChipActive]}>
              <Text style={[styles.catChipText,catFilter===cat&&{color:colors.brand}]}>
                {info?.emoji}{'  '}{info?.label||cat}
              </Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      <FlatList data={filtered} keyExtractor={p=>p.id} contentContainerStyle={styles.productList} showsVerticalScrollIndicator={false}
        renderItem={({item:product}) => (
          <ProductCard product={product} quantity={getQty(product.id)} stock={stockMap[product.id]}
            onAdd={()=>addItem(product)} onRemove={()=>removeItem(product.id)}/>
        )}
        ListEmptyComponent={<View style={styles.emptyProducts}><Text style={{fontSize:36,marginBottom:8}}>🏍️</Text><Text style={{color:colors.textMuted,fontSize:14}}>Nenhum produto encontrado</Text></View>}
      />

      {itemCount > 0 && (
        <TouchableOpacity style={styles.floatingCart} onPress={()=>setCheckoutOpen(true)} activeOpacity={0.9}>
          <View style={styles.floatingCartLeft}>
            <View style={styles.floatingCartBadge}><Text style={styles.floatingCartBadgeText}>{itemCount}</Text></View>
            <Text style={styles.floatingCartLabel}>Fechar venda</Text>
          </View>
          <Text style={styles.floatingCartTotal}>{formatCurrency(total)}</Text>
        </TouchableOpacity>
      )}

      <CheckoutModal visible={checkoutOpen} onClose={()=>setCheckoutOpen(false)} onConfirm={p=>createSaleMutation.mutate({eventId:event.id,...p,items:items.map(i=>({productId:i.product.id,quantity:i.quantity}))})} items={items} total={total} loading={createSaleMutation.isPending}/>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:colors.bg},
  header:{flexDirection:'row',alignItems:'center',paddingHorizontal:16,paddingVertical:12,gap:12},
  backBtn:{width:36,height:36,alignItems:'center',justifyContent:'center',backgroundColor:colors.surface,borderRadius:10,borderWidth:1,borderColor:colors.border},
  headerTitle:{color:colors.textPrimary,fontSize:18,fontWeight:'800'},
  headerSub:{color:colors.textMuted,fontSize:12},
  cartBtn:{backgroundColor:colors.surface,borderWidth:1,borderColor:colors.brandBorder,borderRadius:12,paddingHorizontal:12,paddingVertical:8,alignItems:'center'},
  cartBtnText:{color:colors.brand,fontSize:14,fontWeight:'700'},
  cartTotal:{color:colors.textMuted,fontSize:11,marginTop:1},
  searchBar:{flexDirection:'row',alignItems:'center',backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,borderRadius:12,marginHorizontal:16,marginBottom:12,paddingHorizontal:14,height:46},
  searchInput:{flex:1,color:colors.textPrimary,fontSize:15},
  // Categoria — padding generoso para não cortar emoji
  catFilter:{paddingHorizontal:16,paddingBottom:12,paddingTop:2,gap:8,alignItems:'center'},
  catChip:{paddingHorizontal:16,paddingVertical:9,borderRadius:999,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,minHeight:38},
  catChipActive:{backgroundColor:colors.brandBg,borderColor:colors.brandBorder},
  catChipText:{color:colors.textMuted,fontSize:14,fontWeight:'600',lineHeight:20},
  // Produtos
  productList:{paddingHorizontal:16,paddingBottom:100,gap:10},
  productCard:{backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,borderRadius:14,padding:14,flexDirection:'row',alignItems:'center',gap:14},
  productCardDisabled:{opacity:0.4},
  productEmoji:{width:56,height:56,borderRadius:12,alignItems:'center',justifyContent:'center'},
  productName:{color:colors.textPrimary,fontSize:14,fontWeight:'700',marginBottom:2},
  productCat:{fontSize:12,fontWeight:'600',textTransform:'capitalize',marginBottom:3},
  productPrice:{color:colors.brand,fontSize:16,fontWeight:'900'},
  stockInfo:{color:colors.textMuted,fontSize:11,marginTop:3},
  qtyControl:{alignItems:'center',gap:6},
  qtyBtn:{width:32,height:32,borderRadius:8,backgroundColor:colors.surface2,borderWidth:1,borderColor:colors.border2,alignItems:'center',justifyContent:'center'},
  qtyBtnActive:{backgroundColor:colors.brand,borderColor:colors.brand},
  qtyBtnText:{color:colors.textPrimary,fontSize:18,fontWeight:'700',lineHeight:22},
  qtyValue:{color:colors.textPrimary,fontSize:18,fontWeight:'800',minWidth:28,textAlign:'center'},
  addBtn:{backgroundColor:colors.brandBg,borderWidth:1,borderColor:colors.brandBorder,borderRadius:8,paddingHorizontal:10,paddingVertical:7},
  addBtnText:{color:colors.brand,fontSize:12,fontWeight:'700'},
  // Esgotado badge (substitui o botão)
  esgotadoBadge:{backgroundColor:colors.errorBg,borderWidth:1,borderColor:colors.errorBorder,borderRadius:8,paddingHorizontal:10,paddingVertical:7},
  esgotadoText:{color:colors.error,fontSize:12,fontWeight:'700'},
  // Carrinho flutuante
  floatingCart:{position:'absolute',bottom:24,left:20,right:20,backgroundColor:colors.brand,borderRadius:16,padding:16,flexDirection:'row',alignItems:'center',justifyContent:'space-between',shadowColor:colors.brand,shadowOffset:{width:0,height:8},shadowOpacity:0.5,shadowRadius:16,elevation:10},
  floatingCartLeft:{flexDirection:'row',alignItems:'center',gap:12},
  floatingCartBadge:{backgroundColor:'rgba(0,0,0,0.25)',width:28,height:28,borderRadius:14,alignItems:'center',justifyContent:'center'},
  floatingCartBadgeText:{color:'#fff',fontSize:13,fontWeight:'800'},
  floatingCartLabel:{color:'#fff',fontSize:16,fontWeight:'700'},
  floatingCartTotal:{color:'#fff',fontSize:18,fontWeight:'900'},
  emptyProducts:{alignItems:'center',paddingTop:40},
  // Modal checkout
  modalHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:20,paddingVertical:16,borderBottomWidth:1,borderBottomColor:colors.border},
  modalTitle:{color:colors.textPrimary,fontSize:18,fontWeight:'800'},
  checkoutSection:{color:colors.textMuted,fontSize:11,fontWeight:'700',textTransform:'uppercase',letterSpacing:1.5,marginBottom:10},
  itemsList:{backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,borderRadius:12,overflow:'hidden'},
  checkoutItem:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:14,paddingVertical:12,borderBottomWidth:1,borderBottomColor:colors.border,gap:12},
  checkoutItemName:{flex:1,color:colors.textPrimary,fontSize:14,fontWeight:'600'},
  checkoutItemQty:{color:colors.textMuted,fontSize:12},
  checkoutItemTotal:{color:colors.brand,fontSize:15,fontWeight:'800'},
  paymentGrid:{flexDirection:'row',flexWrap:'wrap',gap:10},
  paymentOption:{flex:1,minWidth:'44%',backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,borderRadius:12,padding:14,alignItems:'center',gap:6},
  paymentOptionActive:{borderColor:colors.brandBorder,backgroundColor:colors.brandBg},
  paymentLabel:{color:colors.textSecondary,fontSize:13,fontWeight:'600'},
  notesInput:{backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,borderRadius:12,padding:14,color:colors.textPrimary,fontSize:14,minHeight:80,textAlignVertical:'top'},
  checkoutFooter:{padding:20,borderTopWidth:1,borderTopColor:colors.border,gap:12},
  totalRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  totalLabel:{color:colors.textMuted,fontSize:16,fontWeight:'600'},
  totalValue:{color:colors.textPrimary,fontSize:28,fontWeight:'900'},
  confirmBtn:{backgroundColor:colors.brand,borderRadius:14,paddingVertical:18,alignItems:'center',shadowColor:colors.brand,shadowOffset:{width:0,height:4},shadowOpacity:0.4,shadowRadius:10,elevation:6},
  confirmBtnText:{color:'#fff',fontSize:17,fontWeight:'800',letterSpacing:0.5},
})
