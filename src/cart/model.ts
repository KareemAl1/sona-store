import { finishName, isFinish, isProductId, MAX_QUANTITY, money, products } from '../catalog';
import type { Finish, ProductId } from '../catalog';

export const STORAGE_KEY = 'sona.cart.v1';
export type CartLine = { productId: ProductId; finish: Finish; quantity: number };
export type CartState = { lines: CartLine[]; revision: number; announcement: string };
export type CartAction = { type: 'add' | 'increase' | 'decrease' | 'remove'; productId: ProductId; finish: Finish };
export type StorageStatus = 'available' | 'unavailable' | 'recovered';
type StorageAccess = () => Pick<Storage, 'getItem' | 'setItem'>;
const browserStorage: StorageAccess = () => window.localStorage;
export const itemCount = (lines: CartLine[]) => lines.reduce((sum, line) => sum + line.quantity, 0);
export const variantKey = (productId: ProductId, finish: Finish) => `${productId}:${finish}`;
export const subtotal = (lines: CartLine[]) => lines.reduce((sum, line) => sum + line.quantity * products[line.productId].price, 0);

export function parseCart(raw: string | null): { lines: CartLine[]; recovered: boolean } {
  if (raw === null) return { lines: [], recovered: false };
  try {
    if (raw.length > 65536) throw new Error('Oversized saved cart');
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object' || !('version' in value) || value.version !== 1 || !('lines' in value) || !Array.isArray(value.lines)) throw new Error('Invalid cart schema');
    const lines: CartLine[] = [];
    let recovered = false;
    for (const entry of value.lines) {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry) || !isProductId(entry.productId) || !isFinish(entry.finish) || !Number.isSafeInteger(entry.quantity) || entry.quantity < 1) { recovered = true; continue; }
      const quantity = Math.min(entry.quantity, MAX_QUANTITY);
      const key = variantKey(entry.productId, entry.finish);
      const existing = lines.find(line => variantKey(line.productId, line.finish) === key);
      if (existing) { existing.quantity = Math.min(existing.quantity + quantity, MAX_QUANTITY); recovered = true; }
      else lines.push({ productId: entry.productId, finish: entry.finish, quantity });
      if (quantity !== entry.quantity) recovered = true;
    }
    return { lines, recovered };
  } catch { return { lines: [], recovered: true }; }
}

export function loadCart(access: StorageAccess = browserStorage): { lines: CartLine[]; status: StorageStatus } {
  try {
    const parsed = parseCart(access().getItem(STORAGE_KEY));
    return { lines: parsed.lines, status: parsed.recovered ? 'recovered' : 'available' };
  } catch { return { lines: [], status: 'unavailable' }; }
}

export function saveCart(lines: CartLine[], access: StorageAccess = browserStorage): boolean {
  try {
    access().setItem(STORAGE_KEY, JSON.stringify({ version: 1, lines }));
    return true;
  } catch { return false; }
}

export function cartReducer(state: CartState, action: CartAction): CartState {
  if (!isProductId(action.productId) || !isFinish(action.finish)) return state;
  const key = variantKey(action.productId, action.finish);
  const existing = state.lines.find(line => variantKey(line.productId, line.finish) === key);
  const label = `${products[action.productId].name} in ${finishName(action.finish)}`;
  let lines = state.lines;
  let message = '';
  if (action.type === 'add' || action.type === 'increase') {
    if (existing?.quantity === MAX_QUANTITY) return { ...state, announcement: `Your bag already has the maximum ${MAX_QUANTITY} ${label} items.` };
    lines = existing ? lines.map(line => line === existing ? { ...line, quantity: line.quantity + 1 } : line) : [...lines, { productId: action.productId, finish: action.finish, quantity: 1 }];
    message = action.type === 'add' ? `${label} added.` : `${label}, quantity ${(existing?.quantity ?? 0) + 1}.`;
  } else if (action.type === 'decrease' && existing && existing.quantity > 1) {
    lines = lines.map(line => line === existing ? { ...line, quantity: line.quantity - 1 } : line);
    message = `${label}, quantity ${existing.quantity - 1}.`;
  } else if (action.type === 'remove' && existing) {
    lines = lines.filter(line => line !== existing);
    message = `${label} removed.`;
  }
  if (lines === state.lines) return state;
  return { lines, revision: state.revision + 1, announcement: `${message} ${lines.length ? `Bag: ${itemCount(lines)} items. Subtotal ${money(subtotal(lines))}.` : 'Your bag is empty.'}` };
}
