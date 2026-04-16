/**
 * src/context/CartContext.jsx
 *
 * Gerencia o carrinho da venda em andamento.
 * O carrinho vive em memória e é limpo após a venda ser enviada.
 */

import { createContext, useContext, useState, useCallback } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState([])  // [{ product, quantity }]

  // Adiciona ou incrementa item no carrinho
  const addItem = useCallback((product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id)
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
  }, [])

  // Remove ou decrementa item
  const removeItem = useCallback((productId) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === productId)
      if (!existing) return prev
      if (existing.quantity <= 1) {
        return prev.filter((i) => i.product.id !== productId)
      }
      return prev.map((i) =>
        i.product.id === productId
          ? { ...i, quantity: i.quantity - 1 }
          : i
      )
    })
  }, [])

  // Define quantidade exata
  const setQuantity = useCallback((productId, quantity) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.product.id !== productId))
    } else {
      setItems((prev) =>
        prev.map((i) =>
          i.product.id === productId ? { ...i, quantity } : i
        )
      )
    }
  }, [])

  // Remove produto completamente
  const deleteItem = useCallback((productId) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId))
  }, [])

  // Limpa o carrinho
  const clearCart = useCallback(() => setItems([]), [])

  // Total em reais
  const total = items.reduce(
    (sum, i) => sum + Number(i.product.price) * i.quantity,
    0
  )

  // Total de itens (quantidade)
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      setQuantity,
      deleteItem,
      clearCart,
      total,
      itemCount,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart deve ser usado dentro de CartProvider')
  return ctx
}
