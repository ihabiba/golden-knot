import { createContext, useContext, useState, type ReactNode } from 'react';

interface CartContextValue {
  itemCount: number;
  setItemCount: (count: number) => void;
  incrementCount: () => void;
  decrementCount: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [itemCount, setItemCount] = useState(0);

  const incrementCount = () => setItemCount((c) => c + 1);
  const decrementCount = () => setItemCount((c) => Math.max(0, c - 1));

  return (
    <CartContext.Provider value={{ itemCount, setItemCount, incrementCount, decrementCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
