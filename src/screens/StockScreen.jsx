/**
 * src/screens/StockScreen.jsx
 * + Busca por nome
 * + Ajuste de quantidade para admin (botões +/-)
 * + Ícones SVG, sem emojis
 * + Imagens resolvidas com resolveImageUrl
 */
import { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, Alert, TextInput, Modal, Image, FlatList,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { eventsService, productsService } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { colors, formatCurrency, CATEGORIES, resolveImageUrl } from '../constants'
import { LoadingScreen, Spinner } from '../components/ui'
import { HamburgerButton } from '../navigation/AppNavigator'
import {
  SearchIcon, CloseIcon, PlusIcon, MinusIcon,
  BoxIcon, CameraIcon, ImageIcon, TrashIcon, EditIcon,
  CATEGORY_ICONS, AlertIcon, CheckIcon, RefreshIcon,
} from '../components/Icons'

// ── ImagePicker opcional ──────────────────────────────────
let ImagePicker = null
try { ImagePicker = require('expo-image-picker') } catch (e) {}

async function pickImage(useCamera = false) {
  if (!ImagePicker) {
    Alert.alert('Módulo não instalado', 'Execute:\n\nnpx expo install expo-image-picker')
    return null
  }
  try {
    if (useCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      if (status !== 'granted') { Alert.alert('Permissão negada', 'Permita a câmera nas configurações.'); return null }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') { Alert.alert('Permissão negada', 'Permita a galeria nas configurações.'); return null }
    }
    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7, allowsEditing: true, aspect: [1, 1] })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7, allowsEditing: true, aspect: [1, 1] })
    if (!result.canceled && result.assets?.[0]) return result.assets[0].uri
    return null
  } catch (e) { Alert.alert('Erro', 'Não foi possível abrir câmera/galeria.'); return null }
}

function StockBar({ current, initial }) {
  const pct = initial > 0 ? Math.round((current / initial) * 100) : 0
  const color = pct === 0 ? colors.error : pct <= 20 ? colors.warning : pct <= 50 ? '#eab308' : colors.success
  return (
    <View style={styles.barContainer}>
      <View style={[styles.barFill, { width: `${Math.max(pct, 0)}%`, backgroundColor: color }]} />
    </View>
  )
}

const EMPTY_PRODUCT = { name: '', category: 'capacete', price: '' }

export default function StockScreen({ navigation, drawerNavigation }) {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const qc = useQueryClient()

  const [addModal, setAddModal]   = useState(false)
  const [form, setForm]           = useState(EMPTY_PRODUCT)
  const [imageUri, setImageUri]   = useState(null)
  const [formError, setFormError] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [search, setSearch]       = useState('')

  // Ajuste de estoque (admin)
  const [adjustModal, setAdjustModal] = useState(null) // { item }
  const [adjustQty, setAdjustQty]     = useState('')
  const [adjustReason, setAdjustReason] = useState('')

  const { data: activeEvent } = useQuery({
    queryKey: ['events-active-mobile'],
    queryFn: eventsService.getActive,
  })

  const { data: stockData, isLoading } = useQuery({
    queryKey: ['stock-mobile', activeEvent?.id],
    queryFn: () => eventsService.getStock(activeEvent.id),
    enabled: !!activeEvent,
    refetchInterval: 20000,
  })

  const createProductMutation = useMutation({
    mutationFn: async (data) => {
      const product = await productsService.create(data)
      if (imageUri) {
        try { await productsService.uploadImage(product.id, imageUri) }
        catch (e) { Alert.alert('Produto criado', 'Imagem não enviada. Tente pelo portal web.') }
      }
      return product
    },
    onSuccess: () => {
      qc.invalidateQueries(['stock-mobile'])
      setAddModal(false); setForm(EMPTY_PRODUCT); setImageUri(null); setFormError('')
      Alert.alert('Produto criado!', 'Defina o estoque pelo portal web.')
    },
    onError: (e) => setFormError(e.response?.data?.error || e.message || 'Erro ao criar.'),
  })

  const adjustMutation = useMutation({
    mutationFn: ({ eventId, productId, newQuantity, reason }) =>
      eventsService.adjustStock(eventId, { productId, newQuantity, reason }),
    onSuccess: () => {
      qc.invalidateQueries(['stock-mobile'])
      setAdjustModal(null); setAdjustQty(''); setAdjustReason('')
    },
    onError: (e) => Alert.alert('Erro', e.response?.data?.error || 'Erro ao ajustar estoque.'),
  })

  const handlePickImage = async (useCamera) => {
    const uri = await pickImage(useCamera)
    if (uri) setImageUri(uri)
  }

  const handleCreate = () => {
    if (!form.name.trim()) { setFormError('Nome é obrigatório.'); return }
    if (!form.price || isNaN(parseFloat(form.price))) { setFormError('Preço inválido.'); return }
    setFormError('')
    createProductMutation.mutate({ name: form.name.trim(), category: form.category, price: parseFloat(form.price) })
  }

  const handleAdjust = () => {
    const qty = parseInt(adjustQty)
    if (isNaN(qty) || qty < 0) { Alert.alert('Erro', 'Digite uma quantidade válida (≥ 0).'); return }
    adjustMutation.mutate({
      eventId: activeEvent.id,
      productId: adjustModal.item.product.id,
      newQuantity: qty,
      reason: adjustReason.trim() || undefined,
    })
  }

  const stocks = stockData?.stocks || []
  const filtered = stocks
    .filter(s => !catFilter || s.product.category === catFilter)
    .filter(s => !search || s.product.name.toLowerCase().includes(search.toLowerCase()))

  const categories = [...new Set(stocks.map(s => s.product.category))]

  if (isLoading && activeEvent) return <LoadingScreen message="Carregando estoque..." />

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <HamburgerButton navigation={drawerNavigation} />
        <Text style={styles.headerTitle}>Estoque</Text>
        {isAdmin && (
          <TouchableOpacity
            onPress={() => { setForm(EMPTY_PRODUCT); setImageUri(null); setFormError(''); setAddModal(true) }}
            style={styles.newBtn}
          >
            <PlusIcon size={14} color={colors.brand} />
            <Text style={styles.newBtnText}>Produto</Text>
          </TouchableOpacity>
        )}
      </View>

      {!activeEvent ? (
        <View style={styles.noEvent}>
          <BoxIcon size={48} color={colors.border2} strokeWidth={1} />
          <Text style={styles.noEventTitle}>Nenhum evento ativo</Text>
          <Text style={styles.noEventSub}>Aguarde o administrador ativar um evento.</Text>
        </View>
      ) : (
        <>
          {/* Busca */}
          <View style={styles.searchBar}>
            <SearchIcon size={16} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              value={search} onChangeText={setSearch}
              placeholder="Buscar produto no estoque..."
              placeholderTextColor={colors.textMuted}
            />
            {!!search && (
              <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <CloseIcon size={14} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Banner do evento */}
          <View style={styles.eventBanner}>
            <View style={styles.eventDot} />
            <Text style={styles.eventName} numberOfLines={1}>{activeEvent.name}</Text>
            <Text style={styles.eventCount}>{filtered.length} itens</Text>
          </View>

          {/* Filtros categoria */}
          {categories.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catFilter}>
              <TouchableOpacity onPress={() => setCatFilter('')} style={[styles.catChip, !catFilter && styles.catChipActive]}>
                <Text style={[styles.catChipText, !catFilter && { color: colors.brand }]}>Todos</Text>
              </TouchableOpacity>
              {categories.map(cat => {
                const info = CATEGORIES[cat]
                const CatIcon = CATEGORY_ICONS[cat]
                const isActive = catFilter === cat
                return (
                  <TouchableOpacity key={cat}
                    onPress={() => setCatFilter(catFilter === cat ? '' : cat)}
                    style={[styles.catChip, isActive && styles.catChipActive]}
                  >
                    {CatIcon && <CatIcon size={13} color={isActive ? colors.brand : colors.textMuted} />}
                    <Text style={[styles.catChipText, isActive && { color: colors.brand }]}>
                      {' '}{info?.label || cat}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          )}

          <FlatList
            data={filtered}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 10 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyStock}>
                <SearchIcon size={40} color={colors.border2} />
                <Text style={{ color: colors.textMuted, marginTop: 12, fontSize: 14 }}>
                  {search ? 'Nenhum produto encontrado' : 'Nenhum produto no estoque'}
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const sold   = item.initialQuantity - item.currentQuantity
              const isEmpty = item.currentQuantity === 0
              const isLow   = item.currentQuantity <= 2 && !isEmpty
              const catInfo = CATEGORIES[item.product.category] || { color: colors.brand }
              const CatIcon = CATEGORY_ICONS[item.product.category]
              const imgUri  = resolveImageUrl(item.product.imageUrl)

              return (
                <View style={[
                  styles.stockCard,
                  isEmpty && styles.stockCardEmpty,
                  isLow   && styles.stockCardLow,
                ]}>
                  <View style={[styles.productThumb, { backgroundColor: `${catInfo.color}18` }]}>
                    {imgUri ? (
                      <Image source={{ uri: imgUri }} style={styles.productThumbImg} onError={() => {}} />
                    ) : (
                      CatIcon
                        ? <CatIcon size={24} color={catInfo.color} strokeWidth={1.5} />
                        : <BoxIcon size={24} color={catInfo.color} strokeWidth={1.5} />
                    )}
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.stockName} numberOfLines={1}>{item.product.name}</Text>
                    <Text style={styles.stockCat}>{item.product.category}</Text>
                    <Text style={styles.stockPrice}>{formatCurrency(item.product.price)}</Text>
                    <StockBar current={item.currentQuantity} initial={item.initialQuantity} />
                    <Text style={styles.stockMeta}>{sold} vendidos · {item.currentQuantity}/{item.initialQuantity}</Text>
                  </View>

                  <View style={styles.stockRight}>
                    <Text style={[
                      styles.stockQtyBig,
                      isEmpty && { color: colors.error },
                      isLow && { color: colors.warning },
                    ]}>
                      {item.currentQuantity}
                    </Text>

                    {/* Botão de ajuste (apenas admin) */}
                    {isAdmin && (
                      <TouchableOpacity
                        style={styles.adjustBtn}
                        onPress={() => {
                          setAdjustModal({ item })
                          setAdjustQty(String(item.currentQuantity))
                          setAdjustReason('')
                        }}
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <EditIcon size={14} color={colors.textMuted} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )
            }}
          />
        </>
      )}

      {/* Modal: ajustar estoque (admin) */}
      <Modal
        visible={!!adjustModal}
        animationType="fade"
        transparent
        onRequestClose={() => setAdjustModal(null)}
      >
        <View style={styles.adjustOverlay}>
          <View style={styles.adjustSheet}>
            <Text style={styles.adjustTitle}>Ajustar Estoque</Text>
            {adjustModal && (
              <Text style={styles.adjustProductName} numberOfLines={2}>
                {adjustModal.item.product.name}
              </Text>
            )}

            <View style={styles.adjustQtyRow}>
              <TouchableOpacity
                style={styles.adjustQtyBtn}
                onPress={() => setAdjustQty(v => String(Math.max(0, parseInt(v || '0') - 1)))}
                activeOpacity={0.7}
              >
                <MinusIcon size={18} color={colors.textPrimary} />
              </TouchableOpacity>

              <TextInput
                style={styles.adjustQtyInput}
                value={adjustQty}
                onChangeText={setAdjustQty}
                keyboardType="number-pad"
                selectTextOnFocus
                textAlign="center"
              />

              <TouchableOpacity
                style={styles.adjustQtyBtn}
                onPress={() => setAdjustQty(v => String(parseInt(v || '0') + 1))}
                activeOpacity={0.7}
              >
                <PlusIcon size={18} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.adjustReasonInput}
              value={adjustReason}
              onChangeText={setAdjustReason}
              placeholder="Justificativa (opcional)"
              placeholderTextColor={colors.textMuted}
            />

            <View style={styles.adjustActions}>
              <TouchableOpacity style={styles.adjustCancelBtn} onPress={() => setAdjustModal(null)}>
                <Text style={{ color: colors.textMuted, fontWeight: '600' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.adjustConfirmBtn, adjustMutation.isPending && { opacity: 0.6 }]}
                onPress={handleAdjust}
                disabled={adjustMutation.isPending}
              >
                {adjustMutation.isPending
                  ? <Spinner size="small" color="#fff" />
                  : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <CheckIcon size={15} color="#fff" strokeWidth={2.5} />
                      <Text style={{ color: '#fff', fontWeight: '700' }}>Salvar</Text>
                    </View>
                  )
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: adicionar produto */}
      <Modal visible={addModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setAddModal(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setAddModal(false)} style={styles.modalCloseBtn}>
              <CloseIcon size={18} color={colors.textMuted} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Novo Produto</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: 40 }}>
            {/* Foto */}
            <View>
              <Text style={styles.fieldLabel}>Foto do Produto</Text>
              <View style={styles.photoRow}>
                <View style={styles.photoPreview}>
                  {imageUri
                    ? <Image source={{ uri: imageUri }} style={styles.photoPreviewImg} />
                    : <CameraIcon size={28} color={colors.border2} strokeWidth={1.5} />
                  }
                </View>
                <View style={styles.photoButtons}>
                  <TouchableOpacity style={styles.photoBtn} onPress={() => handlePickImage(true)} activeOpacity={0.7}>
                    <CameraIcon size={17} color={colors.textSecondary} />
                    <Text style={styles.photoBtnText}>Câmera</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.photoBtn} onPress={() => handlePickImage(false)} activeOpacity={0.7}>
                    <ImageIcon size={17} color={colors.textSecondary} />
                    <Text style={styles.photoBtnText}>Galeria</Text>
                  </TouchableOpacity>
                  {imageUri && (
                    <TouchableOpacity
                      style={[styles.photoBtn, { borderColor: colors.errorBorder }]}
                      onPress={() => setImageUri(null)} activeOpacity={0.7}
                    >
                      <TrashIcon size={15} color={colors.error} />
                      <Text style={{ color: colors.error, fontSize: 13, fontWeight: '600' }}>Remover</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>

            {/* Nome */}
            <View>
              <Text style={styles.fieldLabel}>Nome do Produto</Text>
              <TextInput style={styles.input} value={form.name} onChangeText={v => setForm({ ...form, name: v })}
                placeholder="Ex: Capacete X-11 Escorpion" placeholderTextColor={colors.textMuted} />
            </View>

            {/* Categoria */}
            <View>
              <Text style={styles.fieldLabel}>Categoria</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                {Object.entries(CATEGORIES).map(([key, info]) => {
                  const CatIcon = CATEGORY_ICONS[key]
                  const isActive = form.category === key
                  return (
                    <TouchableOpacity
                      key={key}
                      onPress={() => setForm({ ...form, category: key })}
                      style={[styles.catChip, isActive && styles.catChipActive]}
                      activeOpacity={0.7}
                    >
                      {CatIcon && <CatIcon size={14} color={isActive ? colors.brand : colors.textMuted} />}
                      <Text style={[styles.catChipText, isActive && { color: colors.brand }]}>
                        {' '}{info.label}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </ScrollView>
            </View>

            {/* Preço */}
            <View>
              <Text style={styles.fieldLabel}>Preço (R$)</Text>
              <TextInput style={styles.input} value={form.price} onChangeText={v => setForm({ ...form, price: v })}
                placeholder="0,00" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" />
            </View>

            {formError ? (
              <View style={{ backgroundColor: colors.errorBg, borderWidth: 1, borderColor: colors.errorBorder, borderRadius: 10, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <AlertIcon size={15} color={colors.error} />
                <Text style={{ color: colors.error, fontSize: 13, flex: 1 }}>{formError}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.saveBtn, createProductMutation.isPending && { opacity: 0.6 }]}
              onPress={handleCreate} disabled={createProductMutation.isPending} activeOpacity={0.8}
            >
              {createProductMutation.isPending
                ? <Spinner size="small" color="#fff" />
                : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {imageUri
                      ? <CameraIcon size={17} color="#fff" />
                      : <PlusIcon size={17} color="#fff" />
                    }
                    <Text style={styles.saveBtnText}>
                      {imageUri ? 'Criar com Foto' : 'Criar Produto'}
                    </Text>
                  </View>
                )
              }
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  headerTitle: { flex: 1, color: colors.textPrimary, fontSize: 20, fontWeight: '800' },
  newBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.brandBg, borderWidth: 1, borderColor: colors.brandBorder, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  newBtnText: { color: colors.brand, fontSize: 13, fontWeight: '700' },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, marginHorizontal: 16, marginBottom: 10, paddingHorizontal: 14, height: 44 },
  searchInput: { flex: 1, color: colors.textPrimary, fontSize: 14 },
  eventBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.surface, borderRadius: 10, padding: 12, marginHorizontal: 16, marginBottom: 10, borderWidth: 1, borderColor: colors.successBorder },
  eventDot:   { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.success },
  eventName:  { color: colors.textPrimary, fontSize: 13, fontWeight: '600', flex: 1 },
  eventCount: { color: colors.textMuted, fontSize: 12 },
  catFilter:  { paddingHorizontal: 16, paddingBottom: 12, paddingTop: 2, gap: 8, alignItems: 'center' },
  catChip:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, minHeight: 36 },
  catChipActive: { backgroundColor: colors.brandBg, borderColor: colors.brandBorder },
  catChipText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  noEvent:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  noEventTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  noEventSub:   { color: colors.textMuted, fontSize: 13 },
  emptyStock: { alignItems: 'center', paddingTop: 50 },
  stockCard:  { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  stockCardEmpty: { borderColor: 'rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.04)' },
  stockCardLow:   { borderColor: 'rgba(245,158,11,0.3)', backgroundColor: 'rgba(245,158,11,0.04)' },
  productThumb:    { width: 52, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  productThumbImg: { width: '100%', height: '100%', borderRadius: 12 },
  stockName:  { color: colors.textPrimary, fontSize: 13, fontWeight: '700', marginBottom: 1 },
  stockCat:   { color: colors.textMuted, fontSize: 11, textTransform: 'capitalize', marginBottom: 2 },
  stockPrice: { color: colors.brand, fontSize: 13, fontWeight: '700', marginBottom: 5 },
  barContainer: { height: 3, backgroundColor: colors.border, borderRadius: 2, overflow: 'hidden', marginBottom: 3 },
  barFill:    { height: '100%', borderRadius: 2 },
  stockMeta:  { color: colors.textMuted, fontSize: 10 },
  stockRight: { alignItems: 'center', gap: 8, flexShrink: 0 },
  stockQtyBig: { color: colors.textPrimary, fontSize: 32, fontWeight: '900', lineHeight: 36, minWidth: 40, textAlign: 'center' },
  adjustBtn:  { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 7 },
  // Ajuste modal
  adjustOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  adjustSheet:   { backgroundColor: colors.surface, borderRadius: 20, padding: 24, width: '100%', gap: 16 },
  adjustTitle:   { color: colors.textPrimary, fontSize: 18, fontWeight: '800', textAlign: 'center' },
  adjustProductName: { color: colors.textMuted, fontSize: 13, textAlign: 'center' },
  adjustQtyRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginVertical: 8 },
  adjustQtyBtn:  { width: 48, height: 48, borderRadius: 12, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border2, alignItems: 'center', justifyContent: 'center' },
  adjustQtyInput:{ backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.brand, borderRadius: 12, color: colors.textPrimary, fontSize: 28, fontWeight: '900', width: 90, height: 58 },
  adjustReasonInput: { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border2, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: colors.textPrimary, fontSize: 14 },
  adjustActions: { flexDirection: 'row', gap: 10 },
  adjustCancelBtn:  { flex: 1, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  adjustConfirmBtn: { flex: 2, backgroundColor: colors.brand, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  // Modal novo produto
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalCloseBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface2, borderRadius: 10 },
  modalTitle:  { color: colors.textPrimary, fontSize: 18, fontWeight: '800' },
  fieldLabel:  { color: colors.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  photoRow:    { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  photoPreview:{ width: 88, height: 88, borderRadius: 14, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  photoPreviewImg: { width: '100%', height: '100%', borderRadius: 14 },
  photoButtons: { flex: 1, gap: 8 },
  photoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingVertical: 11 },
  photoBtnText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  input: { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border2, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 13, color: colors.textPrimary, fontSize: 15 },
  saveBtn: { backgroundColor: colors.brand, borderRadius: 14, paddingVertical: 16, alignItems: 'center', shadowColor: colors.brand, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
})
