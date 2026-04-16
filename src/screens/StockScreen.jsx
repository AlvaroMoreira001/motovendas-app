/**
 * src/screens/StockScreen.jsx
 * Gestão de estoque e produtos pelo app mobile
 * Vendedor pode ver estoque e adicionar produtos com foto da câmera/galeria
 */

import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar, Alert, TextInput, Modal, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { eventsService, productsService } from '../services/api'
import { colors, formatCurrency, CATEGORIES } from '../constants'
import { LoadingScreen, Spinner, EmptyState } from '../components/ui'

const pickerOptions = {
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  quality: 0.7,
}

async function pickImage(useCamera = false) {
  if (useCamera) {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permissão', 'É necessário permitir o uso da câmera para tirar a foto do produto.')
      return null
    }
    const result = await ImagePicker.launchCameraAsync(pickerOptions)
    if (result.canceled || !result.assets?.length) return null
    return result.assets[0].uri
  }

  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
  if (status !== 'granted') {
    Alert.alert('Permissão', 'É necessário permitir o acesso à galeria para escolher uma foto.')
    return null
  }
  const result = await ImagePicker.launchImageLibraryAsync(pickerOptions)
  if (result.canceled || !result.assets?.length) return null
  return result.assets[0].uri
}

const EMPTY_PRODUCT = { name: '', category: 'capacete', price: '' }

function StockBar({ current, initial }) {
  const pct = initial > 0 ? Math.round((current / initial) * 100) : 0
  const color = pct === 0 ? '#ef4444' : pct <= 20 ? '#f59e0b' : pct <= 50 ? '#eab308' : '#10b981'
  return (
    <View style={styles.barContainer}>
      <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
    </View>
  )
}

export default function StockScreen({ navigation }) {
  const qc = useQueryClient()
  const [addModal, setAddModal] = useState(false)
  const [form, setForm] = useState(EMPTY_PRODUCT)
  const [imageUri, setImageUri] = useState(null)
  const [formError, setFormError] = useState('')
  const [catFilter, setCatFilter] = useState('')

  const { data: events = [] } = useQuery({ queryKey: ['events-active-mobile'], queryFn: () => eventsService.getActive() })
  const activeEvent = Array.isArray(events) ? events[0] : events

  const { data: stockData, isLoading } = useQuery({
    queryKey: ['stock-mobile', activeEvent?.id],
    queryFn: () => eventsService.getStock(activeEvent.id),
    enabled: !!activeEvent,
    refetchInterval: 20000,
  })

  const createProductMutation = useMutation({
    mutationFn: async (data) => {
      const product = await productsService.create(data)
      // Se tiver imagem, faz upload
      if (imageUri) {
        try {
          const formData = new FormData()
          formData.append('image', { uri: imageUri, name: 'product.jpg', type: 'image/jpeg' })
          await productsService.uploadImage(product.id, formData)
        } catch (e) { /* ignora erro de upload por enquanto */ }
      }
      return product
    },
    onSuccess: () => {
      qc.invalidateQueries(['products-mobile'])
      qc.invalidateQueries(['stock-mobile'])
      setAddModal(false)
      setForm(EMPTY_PRODUCT)
      setImageUri(null)
    },
    onError: (e) => setFormError(e.response?.data?.error || 'Erro ao criar produto.'),
  })

  const handlePickImage = async (useCamera) => {
    const uri = await pickImage(useCamera)
    if (uri) setImageUri(uri)
  }

  const handleCreate = () => {
    if (!form.name || !form.price) { setFormError('Nome e preço são obrigatórios.'); return }
    setFormError('')
    createProductMutation.mutate({ ...form, price: parseFloat(form.price) })
  }

  const stocks = stockData?.stocks || []
  const filtered = catFilter ? stocks.filter(s => s.product.category === catFilter) : stocks
  const categories = [...new Set(stocks.map(s => s.product.category))]

  if (isLoading && activeEvent) return <LoadingScreen message="Carregando estoque..." />

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.menuBtn}>
          <View style={styles.menuLine} /><View style={styles.menuLine} /><View style={styles.menuLine} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Estoque</Text>
        <TouchableOpacity onPress={() => { setForm(EMPTY_PRODUCT); setImageUri(null); setFormError(''); setAddModal(true) }} style={styles.addBtn2}>
          <Text style={styles.addBtn2Text}>+ Produto</Text>
        </TouchableOpacity>
      </View>

      {!activeEvent ? (
        <EmptyState icon="📦" title="Nenhum evento ativo" description="Aguarde o administrador ativar um evento." />
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
          {/* Info evento */}
          <View style={styles.eventBanner}>
            <View style={styles.eventDot} />
            <Text style={styles.eventName}>{activeEvent.name}</Text>
          </View>

          {/* Filtros de categoria */}
          {categories.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catFilter}>
              <TouchableOpacity onPress={() => setCatFilter('')} style={[styles.catChip, !catFilter && styles.catChipActive]}>
                <Text style={[styles.catChipText, !catFilter && { color: colors.brand }]}>Todos</Text>
              </TouchableOpacity>
              {categories.map(cat => (
                <TouchableOpacity key={cat} onPress={() => setCatFilter(catFilter === cat ? '' : cat)}
                  style={[styles.catChip, catFilter === cat && styles.catChipActive]}>
                  <Text style={[styles.catChipText, catFilter === cat && { color: colors.brand }]}>
                    {CATEGORIES[cat]?.emoji}{'  '}{CATEGORIES[cat]?.label || cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Lista de estoque */}
          {filtered.length === 0 ? (
            <EmptyState icon="📦" title="Nenhum produto no estoque" description="Adicione produtos via portal web ou pelo botão acima." />
          ) : (
            <View style={{ gap: 10 }}>
              {filtered.map(item => {
                const sold = item.initialQuantity - item.currentQuantity
                const isEmpty = item.currentQuantity === 0
                const isLow = item.currentQuantity <= 2 && !isEmpty
                const catInfo = CATEGORIES[item.product.category] || { emoji: '📦' }

                return (
                  <View key={item.id} style={[styles.stockCard, isEmpty && styles.stockCardEmpty, isLow && styles.stockCardLow]}>
                    <View style={styles.stockCardLeft}>
                      <View style={[styles.stockEmoji, { backgroundColor: `${CATEGORIES[item.product.category]?.color || colors.brand}20` }]}>
                        <Text style={{ fontSize: 22 }}>{catInfo.emoji}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.stockName}>{item.product.name}</Text>
                        <Text style={styles.stockCat}>{item.product.category}</Text>
                        <Text style={styles.stockPrice}>{formatCurrency(item.product.price)}</Text>
                        <StockBar current={item.currentQuantity} initial={item.initialQuantity} />
                        <Text style={styles.stockMeta}>{sold} vendidos · {item.currentQuantity} restantes de {item.initialQuantity}</Text>
                      </View>
                    </View>
                    <Text style={[styles.stockQty, isEmpty && { color: colors.error }, isLow && { color: colors.warning }]}>
                      {item.currentQuantity}
                    </Text>
                  </View>
                )
              })}
            </View>
          )}
        </ScrollView>
      )}

      {/* Modal: adicionar produto */}
      <Modal visible={addModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setAddModal(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setAddModal(false)}>
              <Text style={{ color: colors.textMuted, fontSize: 16 }}>✕ Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Novo Produto</Text>
            <View style={{ width: 80 }} />
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
            {/* Foto */}
            <View>
              <Text style={styles.fieldLabel}>Foto do Produto</Text>
              <View style={styles.photoRow}>
                <View style={styles.photoPreview}>
                  {imageUri ? <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%', borderRadius: 10 }} /> : <Text style={{ fontSize: 32, opacity: 0.3 }}>📷</Text>}
                </View>
                <View style={styles.photoButtons}>
                  <TouchableOpacity style={styles.photoBtn} onPress={() => handlePickImage(true)}>
                    <Text style={styles.photoBtnText}>📷 Câmera</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.photoBtn} onPress={() => handlePickImage(false)}>
                    <Text style={styles.photoBtnText}>🖼️ Galeria</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View>
              <Text style={styles.fieldLabel}>Nome do Produto</Text>
              <TextInput style={styles.input} value={form.name} onChangeText={v => setForm({ ...form, name: v })}
                placeholder="Ex: Capacete X-11" placeholderTextColor={colors.textMuted} />
            </View>

            <View>
              <Text style={styles.fieldLabel}>Categoria</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                {Object.entries(CATEGORIES).map(([key, info]) => (
                  <TouchableOpacity key={key} onPress={() => setForm({ ...form, category: key })}
                    style={[styles.catChip, form.category === key && styles.catChipActive, { marginBottom: 0 }]}>
                    <Text style={[styles.catChipText, form.category === key && { color: colors.brand }]}>
                      {info.emoji}{'  '}{info.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View>
              <Text style={styles.fieldLabel}>Preço (R$)</Text>
              <TextInput style={styles.input} value={form.price} onChangeText={v => setForm({ ...form, price: v })}
                placeholder="0,00" placeholderTextColor={colors.textMuted} keyboardType="numeric" />
            </View>

            {formError ? <Text style={{ color: colors.error, fontSize: 13 }}>{formError}</Text> : null}

            <TouchableOpacity style={[styles.saveBtn, createProductMutation.isPending && { opacity: 0.6 }]}
              onPress={handleCreate} disabled={createProductMutation.isPending}>
              {createProductMutation.isPending
                ? <Spinner size="small" color="#fff" />
                : <Text style={styles.saveBtnText}>Salvar Produto</Text>}
            </TouchableOpacity>

            <Text style={{ color: colors.textMuted, fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
              ℹ️ Após criar o produto, defina a quantidade no estoque pelo portal web ou peça ao administrador.
            </Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  menuBtn: { width: 36, height: 36, justifyContent: 'center', gap: 5, paddingHorizontal: 6 },
  menuLine: { height: 2, backgroundColor: colors.textMuted, borderRadius: 1 },
  headerTitle: { flex: 1, color: colors.textPrimary, fontSize: 20, fontWeight: '800' },
  addBtn2: { backgroundColor: colors.brandBg, borderWidth: 1, borderColor: colors.brandBorder, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  addBtn2Text: { color: colors.brand, fontSize: 13, fontWeight: '700' },
  eventBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.surface, borderRadius: 10, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: colors.successBorder },
  eventDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  eventName: { color: colors.textPrimary, fontSize: 14, fontWeight: '600', flex: 1 },
  catFilter: { paddingBottom: 14, paddingTop: 2, gap: 8, alignItems: 'center' },
  catChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, minHeight: 38 },
  catChipActive: { backgroundColor: colors.brandBg, borderColor: colors.brandBorder },
  catChipText: { color: colors.textMuted, fontSize: 14, fontWeight: '600', lineHeight: 20 },
  stockCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  stockCardEmpty: { borderColor: 'rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.05)' },
  stockCardLow: { borderColor: 'rgba(245,158,11,0.3)', backgroundColor: 'rgba(245,158,11,0.05)' },
  stockCardLeft: { flex: 1, flexDirection: 'row', gap: 12, alignItems: 'center' },
  stockEmoji: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', shrink: 0 },
  stockName: { color: colors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 2 },
  stockCat: { color: colors.textMuted, fontSize: 11, textTransform: 'capitalize', marginBottom: 2 },
  stockPrice: { color: colors.brand, fontSize: 13, fontWeight: '700', marginBottom: 6 },
  barContainer: { height: 4, backgroundColor: colors.border, borderRadius: 2, overflow: 'hidden', marginBottom: 4 },
  barFill: { height: '100%', borderRadius: 2 },
  stockMeta: { color: colors.textMuted, fontSize: 11 },
  stockQty: { color: colors.textPrimary, fontSize: 32, fontWeight: '900', minWidth: 40, textAlign: 'right' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '800' },
  fieldLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  photoRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  photoPreview: { width: 90, height: 90, borderRadius: 12, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  photoButtons: { flex: 1, gap: 8 },
  photoBtn: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  photoBtnText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
  input: { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border2, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 13, color: colors.textPrimary, fontSize: 15 },
  saveBtn: { backgroundColor: colors.brand, borderRadius: 14, paddingVertical: 16, alignItems: 'center', shadowColor: colors.brand, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
})
