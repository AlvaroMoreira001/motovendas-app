/**
 * src/services/api.js — App Mobile
 *
 * Configuração do Axios para o app Expo/React Native.
 * Upload de imagem usa FormData com o formato que o Expo exige:
 *   { uri, name, type }  — não é um File do browser, é um objeto especial
 */
import axios from 'axios'
import * as SecureStore from 'expo-secure-store'
import { API_URL } from '../constants'

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30s — upload pode demorar em redes lentas
  headers: { 'Content-Type': 'application/json' },
})

// Injeta JWT em toda requisição
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Callback para quando o token expirar
let onUnauthorized = null
export function setUnauthorizedCallback(cb) { onUnauthorized = cb }

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('token')
      await SecureStore.deleteItemAsync('user')
      onUnauthorized?.()
    }
    return Promise.reject(error)
  }
)

// ── AUTH ─────────────────────────────────────────────────
export const authService = {
  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    await SecureStore.setItemAsync('token', data.token)
    await SecureStore.setItemAsync('user', JSON.stringify(data.user))
    return data
  },
  logout: async () => {
    await SecureStore.deleteItemAsync('token')
    await SecureStore.deleteItemAsync('user')
  },
  me: () => api.get('/auth/me').then(r => r.data),
  getSavedUser: async () => {
    const raw = await SecureStore.getItemAsync('user')
    return raw ? JSON.parse(raw) : null
  },
  getToken: () => SecureStore.getItemAsync('token'),
}

// ── EVENTOS ───────────────────────────────────────────────
export const eventsService = {
  getActive: () =>
    api.get('/events', { params: { active: 'true' } }).then(r => r.data[0] || null),
  getStock: (eventId) =>
    api.get(`/events/${eventId}/stock`).then(r => r.data),
}

// ── PRODUTOS ──────────────────────────────────────────────
export const productsService = {
  list: () => api.get('/products').then(r => r.data),

  create: (data) => api.post('/products', data).then(r => r.data),

  /**
   * Faz upload de imagem para um produto existente.
   *
   * No Expo/React Native, o FormData precisa de um objeto especial:
   *   { uri: 'file:///...', name: 'product.jpg', type: 'image/jpeg' }
   *
   * @param {string} productId
   * @param {string} imageUri - URI local retornado pelo expo-image-picker
   */
  uploadImage: async (productId, imageUri) => {
    const token = await SecureStore.getItemAsync('token')

    // Detecta a extensão para definir o mimetype correto
    const ext = imageUri.split('.').pop()?.toLowerCase() || 'jpg'
    const mimeMap = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }
    const mimeType = mimeMap[ext] || 'image/jpeg'

    // FormData especial do React Native — NÃO é o mesmo do browser
    const formData = new FormData()
    formData.append('image', {
      uri: imageUri,
      name: `product_${productId}.${ext}`,
      type: mimeType,
    })

    const response = await fetch(`${API_URL}/products/${productId}/image`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    })

    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.error || 'Erro ao fazer upload da imagem.')
    }

    return response.json()
  },
}

// ── VENDAS ────────────────────────────────────────────────
export const salesService = {
  create: (data) => api.post('/sales', data).then(r => r.data),
  listMy: (params) => api.get('/sales/my', { params }).then(r => r.data),
  getById: (id) => api.get(`/sales/${id}`).then(r => r.data),
}

export default api
