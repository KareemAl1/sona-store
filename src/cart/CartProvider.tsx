import { createContext, useContext, useEffect, useReducer, useState } from 'react';
import type { ReactNode } from 'react';
import { cartReducer, itemCount, loadCart, saveCart, subtotal } from './model';
import type { CartAction, CartLine, StorageStatus } from './model';

type CartValue = { lines: CartLine[]; count: number; total: number; status: StorageStatus; announcement: string; dispatch: (action: CartAction) => void };
const CartContext = createContext<CartValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [restored] = useState(loadCart);
  const [status, setStatus] = useState<StorageStatus>(restored.status);
  const [state, dispatch] = useReducer(cartReducer, { lines: restored.lines, revision: 0, announcement: '' });
  useEffect(() => {
    // Never overwrite stored data with an empty initial render. Only user mutations save.
    if (state.revision === 0) return;
    const saved = saveCart(state.lines);
    // A successful write cannot prove a previously blocked read will work on reload.
    setStatus(previous => saved ? previous : 'unavailable');
  }, [state.lines, state.revision]);
  return <CartContext.Provider value={{ lines: state.lines, count: itemCount(state.lines), total: subtotal(state.lines), status, announcement: state.announcement, dispatch }}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('CartProvider is required');
  return context;
}
