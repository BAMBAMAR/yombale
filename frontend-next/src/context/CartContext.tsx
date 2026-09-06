'use client'
import React, { createContext, useContext, useState, useEffect } from 'react'

export interface CartItem {
  id: string
  produitId?: string
  varianteId?: string | null
  nom: string
  detailsVariante?: string | null
  prix: number
  images?: string[]
  quantite: number
  uniteVente?: string | null
}

export interface BoutiqueCart {
  boutiqueId: string
  boutiqueNom: string
  whatsapp?: string | null
  items: CartItem[]
}

interface CartContextType {
  carts: Record<string, BoutiqueCart>
  activeBoutiqueId: string | null
  isCartOpen: boolean
  totalItemCount: number
  openCart: (boutiqueId?: string) => void
  closeCart: () => void
  addToCart: (
    boutiqueId: string,
    boutiqueNom: string,
    produit: {
      id: string
      nom: string
      prix: number | null
      images?: string[]
      varianteId?: string | null
      detailsVariante?: string | null
      uniteVente?: string | null
    },
    whatsapp?: string | null,
    autoOpen?: boolean
  ) => void
  removeFromCart: (boutiqueId: string, productId: string) => void
  updateQuantity: (boutiqueId: string, productId: string, delta: number) => void
  clearCart: (boutiqueId: string) => void
  getCartTotal: (boutiqueId: string) => number
  getCartItemCount: (boutiqueId: string) => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [carts, setCarts] = useState<Record<string, BoutiqueCart>>({})
  const [activeBoutiqueId, setActiveBoutiqueId] = useState<string | null>(null)
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false)

  // Charger le panier depuis localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('nopalou_carts')
      if (saved) {
        setCarts(JSON.parse(saved))
      }
    } catch { /* ignoré */ }
  }, [])

  // Sauvegarder dans localStorage à chaque modification
  useEffect(() => {
    try {
      localStorage.setItem('nopalou_carts', JSON.stringify(carts))
    } catch { /* ignoré */ }
  }, [carts])

  function openCart(boutiqueId?: string) {
    const targetId = boutiqueId || activeBoutiqueId || Object.keys(carts)[0] || null
    if (targetId) {
      setActiveBoutiqueId(targetId)
    }
    setIsCartOpen(true)
  }

  function closeCart() {
    setIsCartOpen(false)
  }

  const totalItemCount = Object.values(carts).reduce((acc, c) => {
    return acc + (c.items || []).reduce((sum, item) => sum + (item.quantite || 0), 0)
  }, 0)

  function addToCart(
    boutiqueId: string,
    boutiqueNom: string,
    produit: {
      id: string
      nom: string
      prix: number | null
      images?: string[]
      varianteId?: string | null
      detailsVariante?: string | null
      uniteVente?: string | null
    },
    whatsapp?: string | null,
    autoOpen: boolean = false
  ) {
    const prix = produit.prix || 0
    const itemKey = produit.varianteId
      ? `${produit.id}_var_${produit.varianteId}`
      : (produit.detailsVariante ? `${produit.id}_det_${encodeURIComponent(produit.detailsVariante)}` : produit.id)

    setCarts(prev => {
      const existingCart = prev[boutiqueId] || { boutiqueId, boutiqueNom, whatsapp, items: [] }
      const itemIndex = existingCart.items.findIndex(i => i.id === itemKey)

      let newItems = [...existingCart.items]
      if (itemIndex >= 0) {
        newItems[itemIndex] = {
          ...newItems[itemIndex],
          quantite: newItems[itemIndex].quantite + 1
        }
      } else {
        newItems.push({
          id: itemKey,
          produitId: produit.id,
          varianteId: produit.varianteId || null,
          nom: produit.nom,
          detailsVariante: produit.detailsVariante || null,
          prix,
          images: produit.images,
          quantite: 1,
          uniteVente: produit.uniteVente || 'piece',
        })
      }

      const updatedWhatsapp = whatsapp || existingCart.whatsapp || null
      return {
        ...prev,
        [boutiqueId]: { ...existingCart, boutiqueNom, whatsapp: updatedWhatsapp, items: newItems }
      }
    })

    setActiveBoutiqueId(boutiqueId)
    if (autoOpen) {
      setIsCartOpen(true)
    }
  }

  function removeFromCart(boutiqueId: string, productId: string) {
    setCarts(prev => {
      const existing = prev[boutiqueId]
      if (!existing) return prev
      const newItems = existing.items.filter(i => i.id !== productId)
      return {
        ...prev,
        [boutiqueId]: { ...existing, items: newItems }
      }
    })
  }

  function updateQuantity(boutiqueId: string, productId: string, delta: number) {
    setCarts(prev => {
      const existing = prev[boutiqueId]
      if (!existing) return prev
      const newItems = existing.items.map(i => {
        if (i.id === productId) {
          const newQte = i.quantite + delta
          return newQte > 0 ? { ...i, quantite: newQte } : null
        }
        return i
      }).filter(Boolean) as CartItem[]

      return {
        ...prev,
        [boutiqueId]: { ...existing, items: newItems }
      }
    })
  }

  function clearCart(boutiqueId: string) {
    setCarts(prev => {
      const copy = { ...prev }
      delete copy[boutiqueId]
      return copy
    })
  }

  function getCartTotal(boutiqueId: string): number {
    const cart = carts[boutiqueId]
    if (!cart) return 0
    return cart.items.reduce((acc, item) => acc + (item.prix * item.quantite), 0)
  }

  function getCartItemCount(boutiqueId: string): number {
    const cart = carts[boutiqueId]
    if (!cart) return 0
    return cart.items.reduce((acc, item) => acc + item.quantite, 0)
  }

  return (
    <CartContext.Provider value={{
      carts,
      activeBoutiqueId,
      isCartOpen,
      totalItemCount,
      openCart,
      closeCart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartTotal,
      getCartItemCount,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart doit être utilisé au sein de CartProvider')
  }
  return context
}
