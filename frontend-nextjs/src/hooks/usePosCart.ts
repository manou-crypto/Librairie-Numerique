// usePosCart.ts — Gestion du panier POS avec TVA dynamique par produit
// Conforme à la base de données : chaque produit a son propre taux_tva (table produit.taux_tva)
'use client';

import { useState, useCallback } from 'react';

export interface CartProduct {
  id: string;
  name: string;
  reference: string;
  category: string;
  prixAchat: number; // Prix d'achat HT — pour calcul de marge
  prixVente: number; // Prix de vente HT
  tauxTva: number; // Taux TVA spécifique au produit (ex: 18 pour 18%)
  stock: number;
}

export interface CartItem extends CartProduct {
  qty: number;
  lineTotalHT: number; // qty × prixVente (HT)
  lineTva: number; // qty × prixVente × (tauxTva / 100)
  lineTotalTTC: number; // lineTotalHT + lineTva
  lineMargeUnitaire: number; // prixVente - prixAchat (snapshot)
  lineMargeTotale: number; // lineMargeUnitaire × qty
}

interface CartTotals {
  totalHT: number;
  totalTva: number;
  totalTTC: number;
  margeTotale: number;
  totalItems: number;
}

interface UsePosCartReturn extends CartTotals {
  cart: CartItem[];
  addToCart: (product: CartProduct) => boolean;
  removeFromCart: (productId: string) => void;
  updateQty: (productId: string, delta: number) => boolean;
  clearCart: () => void;
  isInCart: (productId: string) => boolean;
  getCartItem: (productId: string) => CartItem | undefined;
}

/** Calcule tous les montants d'une ligne à partir du produit et de la quantité */
function buildCartItem(product: CartProduct, qty: number): CartItem {
  const lineTotalHT = qty * product.prixVente;
  const lineTva = lineTotalHT * (product.tauxTva / 100);
  const lineTotalTTC = lineTotalHT + lineTva;
  const lineMargeUnitaire = product.prixVente - product.prixAchat;
  const lineMargeTotale = lineMargeUnitaire * qty;

  return {
    ...product,
    qty,
    lineTotalHT,
    lineTva,
    lineTotalTTC,
    lineMargeUnitaire,
    lineMargeTotale,
  };
}

export function usePosCart(): UsePosCartReturn {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = useCallback((product: CartProduct): boolean => {
    if (product.stock === 0) return false;

    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) return prev; // Stock épuisé
        return prev.map((i) => (i.id === product.id ? buildCartItem(product, i.qty + 1) : i));
      }
      return [...prev, buildCartItem(product, 1)];
    });
    return true;
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((i) => i.id !== productId));
  }, []);

  const updateQty = useCallback((productId: string, delta: number): boolean => {
    let success = true;
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.id !== productId) return i;
          const newQty = i.qty + delta;
          if (newQty > i.stock) {
            success = false;
            return i;
          }
          return buildCartItem(i, newQty);
        })
        .filter((i) => i.qty > 0)
    );
    return success;
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const isInCart = useCallback(
    (productId: string): boolean => cart.some((i) => i.id === productId),
    [cart]
  );

  const getCartItem = useCallback(
    (productId: string): CartItem | undefined => cart.find((i) => i.id === productId),
    [cart]
  );

  // Totaux agrégés — calculés depuis les lignes (TVA par produit, conforme à ligne_vente)
  const totalHT = cart.reduce((s, i) => s + i.lineTotalHT, 0);
  const totalTva = cart.reduce((s, i) => s + i.lineTva, 0);
  const totalTTC = cart.reduce((s, i) => s + i.lineTotalTTC, 0);
  const margeTotale = cart.reduce((s, i) => s + i.lineMargeTotale, 0);
  const totalItems = cart.reduce((s, i) => s + i.qty, 0);

  return {
    cart,
    totalHT,
    totalTva,
    totalTTC,
    margeTotale,
    totalItems,
    addToCart,
    removeFromCart,
    updateQty,
    clearCart,
    isInCart,
    getCartItem,
  };
}
