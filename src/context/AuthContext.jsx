/**
 * src/context/AuthContext.jsx
 *
 * Estado global de autenticação do app.
 * Persiste login entre sessões usando expo-secure-store.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authService, setUnauthorizedCallback } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Função chamada quando o token expira (401 em qualquer request)
  const handleUnauthorized = useCallback(() => {
    setUser(null)
  }, [])

  useEffect(() => {
    // Registra o callback de sessão expirada
    setUnauthorizedCallback(handleUnauthorized)

    // Verifica se há sessão salva ao iniciar o app
    const init = async () => {
      try {
        const token = await authService.getToken()
        if (token) {
          // Valida o token com o backend
          const me = await authService.me()
          setUser(me)
        }
      } catch {
        // Token inválido ou expirado — limpa
        await authService.logout()
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [])

  const login = async (email, password) => {
    const data = await authService.login(email, password)
    setUser(data.user)
    return data.user
  }

  const logout = async () => {
    await authService.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      loading,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
