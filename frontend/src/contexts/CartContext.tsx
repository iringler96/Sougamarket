import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { CartItem, Product } from '../types';

interface CartContextType {
  items: CartItem[];
  total: number;
  addToCart: (product: Product) => void;
  increase: (productId: number) => void;
  decrease: (productId: number) => void;
  remove: (productId: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const STORAGE_KEY = 'tienda_cart';

function getEffectivePrice(product: {
  price: number;
  offerPrice?: number | null;
  offerEnabled?: boolean;
}) {
  if (
    product.offerEnabled &&
    product.offerPrice &&
    product.offerPrice > 0 &&
    product.offerPrice < product.price
  ) {
    return product.offerPrice;
  }

  return product.price;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addToCart = (product: Product) => {
    setItems((current) => {
      const existing = current.find((item) => item.product.id === product.id);

      if (existing) {
        return current.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) }
            : item
        );
      }

      return [...current, { product, quantity: 1 }];
    });
  };

  const increase = (productId: number) => {
    setItems((current) =>
      current.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              quantity: Math.min(item.quantity + 1, item.product.stock)
            }
          : item
      )
    );
  };

  const decrease = (productId: number) => {
    setItems((current) =>
      current
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: Math.max(item.quantity - 1, 0) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const remove = (productId: number) => {
    setItems((current) => current.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const total = useMemo(
    () => items.reduce((acc, item) => acc + getEffectivePrice(item.product) * item.quantity, 0),
    [items]
  );

  const value = useMemo(
    () => ({ items, total, addToCart, increase, decrease, remove, clearCart }),
    [items, total]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart debe usarse dentro de CartProvider');
  }

  return context;
}