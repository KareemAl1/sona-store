import { useEffect, useRef } from 'react';
import { useCart } from './cart/CartProvider';
import { products } from './catalog';

type ModelContext = { registerTool: (tool: { name: string; title: string; description: string; inputSchema: object; annotations: { readOnlyHint: boolean }; execute: (input: unknown) => unknown }, options: { signal: AbortSignal }) => unknown };

/** Optional, read-only browser integration. No network access and no alternate cart state. */
export function useBagInspection() {
  const cart = useCart();
  const latest = useRef(cart);
  latest.current = cart;
  useEffect(() => {
    const context = (document as Document & { modelContext?: ModelContext }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try {
      void Promise.resolve(context.registerTool({
        name: 'get_sona_bag', title: 'Inspect the Sona bag',
        description: 'Read the current fictional Sona cart and its local persistence status. Does not change the cart, place orders, or make payments.',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: true },
        execute(input: unknown) {
          if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).length) throw new TypeError('Expected an empty object');
          const state = latest.current;
          return { currency: 'USD', subtotalCents: state.total, itemCount: state.count, storage: state.status, fictional: true, lines: state.lines.map(line => ({ ...line, unitPriceCents: products[line.productId].price })) };
        },
      }, { signal: lifecycle.signal })).catch(() => { /* Browser enhancement is optional. */ });
    } catch { /* Unsupported implementations must not affect shopping. */ }
    return () => lifecycle.abort();
  }, []);
}
