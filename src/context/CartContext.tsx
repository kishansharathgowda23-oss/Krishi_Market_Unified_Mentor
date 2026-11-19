import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { CartItem, Product } from '../types';

const CART_STORAGE_KEY = 'krishi_market_cart_v1';

interface CartContextValue {
  items: CartItem[];
  isDrawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  addToCart: (product: Product, quantity?: number) => { ok: boolean; message: string };
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  });
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addToCart = useCallback((product: Product, quantity = 1) => {
    if (!product.isAvailable || product.availableQuantity <= 0) {
      return { ok: false, message: `${product.name} is currently out of stock.` };
    }
    let result = { ok: true, message: `Added ${product.name} to basket.` };

    setItems((prev) => {
      const existing = prev.find((i) => i.product._id === product._id);
      if (existing) {
        const nextQty = existing.quantity + quantity;
        if (nextQty > product.availableQuantity) {
          result = {
            ok: false,
            message: `Maximum available stock is ${product.availableQuantity} ${product.unit}.`,
          };
          return prev;
        }
        return prev.map((i) =>
          i.product._id === product._id ? { ...i, product, quantity: nextQty } : i
        );
      }
      if (quantity > product.availableQuantity) {
        result = {
          ok: false,
          message: `Only ${product.availableQuantity} ${product.unit} available.`,
        };
        return prev;
      }
      return [...prev, { product, quantity }];
    });

    return result;
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) {
        return prev.filter((i) => i.product._id !== productId);
      }
      return prev.map((i) => {
        if (i.product._id !== productId) return i;
        const clamped = Math.min(quantity, i.product.availableQuantity);
        return { ...i, quantity: clamped };
      });
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product._id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.product.pricePerUnit * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        isDrawerOpen,
        setDrawerOpen,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalItems,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
