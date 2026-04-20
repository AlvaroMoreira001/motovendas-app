/**
 * src/screens/StockScreen.jsx
 *
 * Tela de estoque do app mobile.
 * Inclui visualização do estoque e criação de produto com foto.
 *
 * Dependência necessária para câmera/galeria:
 *   npx expo install expo-image-picker
 */

import { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, Alert, TextInput, Modal, Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { eventsService, productsService } from '../services/api'
import { colors, formatCurrency, CATEGORIES } from '../constants'
import { LoadingScreen, Spinner, EmptyState } from '../components/ui'

// ── Câmera / Galeria ──────────────────────────────────────
// Tenta importar expo-image-picker dinamicamente
let ImagePicker = null
try { ImagePicker = require('expo-image-picker') } catch (e) {}

async function pickImage(useCamera = false) {
  if (!ImagePicker) {
    Alert.alert(
      'Módulo não instalado',
      'Para usar câmera e galeria, rode:\n\nnpx expo install expo-image-picker\n\ne reinicie o app.',
      [{ text: 'OK' }]
    )
    return null
  }

  try {
    // Pede permissão
    if (useCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Permita o acesso à câmera nas configurações do celular.')
        return null
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Permita o acesso à galeria nas configurações do celular.')
        return null
      }
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.7,
          allowsEditing: true,
          aspect: [1, 1],
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.7,
          allowsEditing: true,
          aspect: [1, 1],
        })

    if (!result.canceled && result.assets?.[0]) {
      return result.assets[0].uri
    }
    return null
  } catch (e) {
    Alert.alert('Erro', 'Não foi possível acessar a câmera/galeria.')
    return null
  }
}

// ── Barra de progresso de estoque ─────────────────────────
function StockBar({ current, initial }) {
  const pct = initial > 0 ? Math.round((current / initial) * 100) : 0
  const color = pct === 0 ? '#ef4444' : pct <= 20 ? '#f59e0b' : pct <= 50 ? '#eab308' : '#10b981'
  return (
    <View style={styles.barContainer}>
      <View style={[styles.barFill, { width: `${Math.max(pct, 0)}%`, backgroundColor: color }]} />
    </View>
  )
}

const EMPTY_PRODUCT = { name: '', category: 'capacete', price: '' }

export default function StockScreen({ navigation }) {
  const qc = useQueryClient()
  const [addModal, setAddModal] = useState(false)
  const [form, setForm] = useState(EMPTY_PRODUCT)
  const [imageUri, setImageUri] = useState(null)
  const [formError, setFormError] = useState('')
  const [catFilter, setCatFilter] = useState('')

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
      // 1. Cria o produto
      const product = await productsService.create(data)

      // 2. Se selecionou imagem, faz upload
      if (imageUri) {
        try {
          await productsService.uploadImage(product.id, imageUri)
        } catch (e) {
          // Upload de imagem falhou mas o produto foi criado — avisa o usuário
          Alert.alert(
            'Produto criado',
            'O produto foi criado, mas houve um erro ao enviar a imagem. Você pode adicioná-la depois pelo portal web.',
            [{ text: 'OK' }]
          )
        }
      }

      return product
    },
    onSuccess: () => {
      qc.invalidateQueries(['products-mobile'])
      qc.invalidateQueries(['stock-mobile'])
      setAddModal(false)
      setForm(EMPTY_PRODUCT)
      setImageUri(null)
      setFormError('')
      Alert.alert('Sucesso!', 'Produto criado. Defina a quantidade no estoque pelo portal web.')
    },
    onError: (e) => {
      setFormError(e.response?.data?.error || e.message || 'Erro ao criar produto.')
    },
  })

  const handlePickImage = async (useCamera) => {
    const uri = await pickImage(useCamera)
    if (uri) setImageUri(uri)
  }

  const handleCreate = () => {
    if (!form.name.trim()) { setFormError('Nome é obrigatório.'); return }
    if (!form.price || isNaN(parseFloat(form.price))) { setFormError('Preço inválido.'); return }
    setFormError('')
    createProductMutation.mutate({
      name: form.name.trim(),
      category: form.category,
      price: parseFloat(form.price),
    })
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
        <TouchableOpacity
          onPress={() => navigation.openDrawer?.() || navigation.goBack()}
          style={styles.menuBtn}
        >
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Estoque</Text>
        <TouchableOpacity
          onPress={() => { setForm(EMPTY_PRODUCT); setImageUri(null); setFormError(''); setAddModal(true) }}
          style={styles.newBtn}
        >
          <Text style={styles.newBtnText}>+ Produto</Text>
        </TouchableOpacity>
      </View>

      {!activeEvent ? (
        <EmptyState icon="📦" title="Nenhum evento ativo" description="Aguarde o administrador ativar um evento." />
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Banner do evento */}
          <View style={styles.eventBanner}>
            <View style={styles.eventDot} />
            <Text style={styles.eventName} numberOfLines={1}>{activeEvent.name}</Text>
          </View>

          {/* Filtros por categoria */}
          {categories.length > 0 && (
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

          {/* Itens de estoque */}
          {filtered.length === 0 ? (
            <EmptyState icon="📦" title="Nenhum produto no estoque" description="Adicione produtos via portal web ou pelo botão acima." />
          ) : (
            <View style={{ gap: 10 }}>
              {filtered.map(item => {
                const sold = item.initialQuantity - item.currentQuantity
                const isEmpty = item.currentQuantity === 0
                const isLow = item.currentQuantity <= 2 && !isEmpty
                const catInfo = CATEGORIES[item.product.category] || { emoji: '📦', color: colors.brand }

                return (
                  <View key={item.id} style={[
                    styles.stockCard,
                    isEmpty && styles.stockCardEmpty,
                    isLow && styles.stockCardLow,
                  ]}>
                    {/* Imagem ou emoji */}
                    <View style={[styles.productThumb, { backgroundColor: `${catInfo.color}20` }]}>
                      {item.product.imageUrl ? (
                        <Image
                          source={{ uri: item.product.imageUrl }}
                          style={styles.productThumbImg}
                          onError={() => {}}
                        />
                      ) : (
                        <Text style={{ fontSize: 24 }}>{catInfo.emoji}</Text>
                      )}
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.stockName} numberOfLines={1}>{item.product.name}</Text>
                      <Text style={styles.stockCat}>{item.product.category}</Text>
                      <Text style={styles.stockPrice}>{formatCurrency(item.product.price)}</Text>
                      <StockBar current={item.currentQuantity} initial={item.initialQuantity} />
                      <Text style={styles.stockMeta}>{sold} vendidos · {item.currentQuantity} restantes de {item.initialQuantity}</Text>
                    </View>

                    {/* Quantidade em destaque */}
                    <Text style={[
                      styles.stockQtyBig,
                      isEmpty && { color: colors.error },
                      isLow && { color: colors.warning },
                    ]}>
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

          {/* Header do modal */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setAddModal(false)}>
              <Text style={{ color: colors.textMuted, fontSize: 16 }}>✕ Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Novo Produto</Text>
            <View style={{ width: 80 }} />
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: 40 }}>

            {/* Foto */}
            <View>
              <Text style={styles.fieldLabel}>Foto do Produto</Text>
              <View style={styles.photoRow}>
                {/* Preview */}
                <View style={styles.photoPreview}>
                  {imageUri ? (
                    <Image source={{ uri: imageUri }} style={styles.photoPreviewImg} />
                  ) : (
                    <Text style={{ fontSize: 36, opacity: 0.25 }}>📷</Text>
                  )}
                </View>

                {/* Botões de câmera e galeria */}
                <View style={styles.photoButtons}>
                  <TouchableOpacity style={styles.photoBtn} onPress={() => handlePickImage(true)} activeOpacity={0.7}>
                    <Text style={styles.photoBtnIcon}>📷</Text>
                    <Text style={styles.photoBtnText}>Câmera</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.photoBtn} onPress={() => handlePickImage(false)} activeOpacity={0.7}>
                    <Text style={styles.photoBtnIcon}>🖼️</Text>
                    <Text style={styles.photoBtnText}>Galeria</Text>
                  </TouchableOpacity>
                  {imageUri && (
                    <TouchableOpacity style={[styles.photoBtn, { borderColor: colors.errorBorder }]}
                      onPress={() => setImageUri(null)} activeOpacity={0.7}>
                      <Text style={{ color: colors.error, fontSize: 12, fontWeight: '600' }}>✕ Remover</Text>
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
                {Object.entries(CATEGORIES).map(([key, info]) => (
                  <TouchableOpacity key={key} onPress={() => setForm({ ...form, category: key })}
                    style={[styles.catChip, form.category === key && styles.catChipActive, { marginBottom: 0 }]}
                    activeOpacity={0.7}>
                    <Text style={[styles.catChipText, form.category === key && { color: colors.brand }]}>
                      {info.emoji}{'  '}{info.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Preço */}
            <View>
              <Text style={styles.fieldLabel}>Preço (R$)</Text>
              <TextInput style={styles.input} value={form.price} onChangeText={v => setForm({ ...form, price: v })}
                placeholder="0,00" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" />
            </View>

            {formError ? (
              <View style={{ backgroundColor: colors.errorBg, borderWidth: 1, borderColor: colors.errorBorder, borderRadius: 10, padding: 12 }}>
                <Text style={{ color: colors.error, fontSize: 13 }}>⚠️ {formError}</Text>
              </View>
            ) : null}

            {/* Botão salvar */}
            <TouchableOpacity
              style={[styles.saveBtn, createProductMutation.isPending && { opacity: 0.6 }]}
              onPress={handleCreate}
              disabled={createProductMutation.isPending}
              activeOpacity={0.8}
            >
              {createProductMutation.isPending
                ? <Spinner size="small" color="#fff" />
                : <Text style={styles.saveBtnText}>
                    {imageUri ? '📷 Criar com Foto' : 'Criar Produto'}
                  </Text>
              }
            </TouchableOpacity>

            <Text style={{ color: colors.textMuted, fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
              ℹ️ Após criar, defina a quantidade no estoque via portal web ou peça ao administrador.
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
  newBtn: { backgroundColor: colors.brandBg, borderWidth: 1, borderColor: colors.brandBorder, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  newBtnText: { color: colors.brand, fontSize: 13, fontWeight: '700' },
  eventBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.surface, borderRadius: 10, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: colors.successBorder },
  eventDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  eventName: { color: colors.textPrimary, fontSize: 14, fontWeight: '600', flex: 1 },
  catFilter: { paddingBottom: 14, paddingTop: 2, gap: 8, alignItems: 'center' },
  catChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, minHeight: 38 },
  catChipActive: { backgroundColor: colors.brandBg, borderColor: colors.brandBorder },
  catChipText: { color: colors.textMuted, fontSize: 14, fontWeight: '600', lineHeight: 20 },
  // Cards de estoque
  stockCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  stockCardEmpty: { borderColor: 'rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.04)' },
  stockCardLow: { borderColor: 'rgba(245,158,11,0.3)', backgroundColor: 'rgba(245,158,11,0.04)' },
  productThumb: { width: 52, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  productThumbImg: { width: '100%', height: '100%', borderRadius: 12 },
  stockName: { color: colors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 1 },
  stockCat: { color: colors.textMuted, fontSize: 11, textTransform: 'capitalize', marginBottom: 2 },
  stockPrice: { color: colors.brand, fontSize: 13, fontWeight: '700', marginBottom: 5 },
  barContainer: { height: 4, backgroundColor: colors.border, borderRadius: 2, overflow: 'hidden', marginBottom: 3 },
  barFill: { height: '100%', borderRadius: 2 },
  stockMeta: { color: colors.textMuted, fontSize: 11 },
  stockQtyBig: { color: colors.textPrimary, fontSize: 34, fontWeight: '900', minWidth: 42, textAlign: 'right', flexShrink: 0 },
  // Modal
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '800' },
  fieldLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  // Foto
  photoRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  photoPreview: { width: 90, height: 90, borderRadius: 14, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  photoPreviewImg: { width: '100%', height: '100%', borderRadius: 14 },
  photoButtons: { flex: 1, gap: 8 },
  photoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingVertical: 11 },
  photoBtnIcon: { fontSize: 17 },
  photoBtnText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
  // Inputs
  input: { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border2, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 13, color: colors.textPrimary, fontSize: 15 },
  // Botão salvar
  saveBtn: { backgroundColor: colors.brand, borderRadius: 14, paddingVertical: 16, alignItems: 'center', shadowColor: colors.brand, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
})
