/**
 * src/services/api.js
 *
 * Cliente HTTP configurado para o backend MotoVendas.
 * - Injeta o token JWT automaticamente
 * - Redireciona para login em caso de token expirado
 * - Usa expo-secure-store para armazenar o token com segurança
 */

import axios from 'axios'
import * as SecureStore from 'expo-secure-store'
import { API_URL } from '../constants'

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Interceptor de REQUEST: injeta o token JWT ────────────
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Interceptor de RESPONSE: trata erros globais ─────────
// O redirecionamento para login é feito via callback
let onUnauthorized = null
export function setUnauthorizedCallback(cb) { onUnauthorized = cb }

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('token')
      await SecureStore.deleteItemAsync('user')
      onUnauthorized?.()
    }
    return Promise.reject(error)
  }
)

// ============================================================
// AUTH
// ============================================================
export const authService = {
  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    // Salva token e usuário de forma segura no dispositivo
    await SecureStore.setItemAsync('token', data.token)
    await SecureStore.setItemAsync('user', JSON.stringify(data.user))
    return data
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('token')
    await SecureStore.deleteItemAsync('user')
  },

  me: () => api.get('/auth/me').then((r) => r.data),

  getSavedUser: async () => {
    const raw = await SecureStore.getItemAsync('user')
    return raw ? JSON.parse(raw) : null
  },

  getToken: () => SecureStore.getItemAsync('token'),
}

// ============================================================
// EVENTOS
// ============================================================
export const eventsService = {
  // Retorna o evento ativo (o vendedor só vê o que está ativo)
  getActive: () =>
    api.get('/events', { params: { active: 'true' } }).then((r) => r.data[0] || null),

  getStock: (eventId) =>
    api.get(`/events/${eventId}/stock`).then((r) => r.data),
}

// ============================================================
// PRODUTOS
// ============================================================
export const productsService = {
  // Lista todos os produtos ativos (para montar o carrinho)
  list: () => api.get('/products').then((r) => r.data),
}

// ============================================================
// VENDAS
// ============================================================
export const salesService = {
  // Cria uma nova venda (debita estoque automaticamente no backend)
  create: (data) => api.post('/sales', data).then((r) => r.data),

  // Histórico de vendas do próprio vendedor
  listMy: (params) => api.get('/sales/my', { params }).then((r) => r.data),

  // Detalhes de uma venda
  getById: (id) => api.get(`/sales/${id}`).then((r) => r.data),
}

export default api
