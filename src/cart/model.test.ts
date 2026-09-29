import { describe, expect, it } from 'vitest';
import { cartReducer, itemCount, loadCart, parseCart, saveCart, STORAGE_KEY, subtotal, variantKey } from './model';
import type { CartAction, CartState } from './model';

describe('cart data boundaries', () => {
  it('merges duplicate variants, rejects invalid entries and ignores stored prices', () => {
    const parsed = parseCart(JSON.stringify({ version: 1, lines: [
      { productId: 'arc', finish: 'fig', quantity: 2, price: 1 },
      { productId: 'arc', finish: 'fig', quantity: 1 },
      { productId: 'arc', finish: 'pearl', quantity: 1 },
      { productId: 'arc', finish: 'unknown', quantity: 1 },
      { productId: 'other', finish: 'pearl', quantity: 2 },
      { productId: 'arc', finish: 'graphite', quantity: -1 },
      { productId: 'arc', finish: 'graphite', quantity: 1.2 },
      { productId: 'arc', finish: 'graphite', quantity: '2' },
    ] }));
    expect(parsed.lines).toEqual([{ productId: 'arc', finish: 'fig', quantity: 3 }, { productId: 'arc', finish: 'pearl', quantity: 1 }]);
    expect(subtotal(parsed.lines)).toBe(99600);
    expect(parsed.recovered).toBe(true);
  });
  it('restores the original Arc-only schema without a migration or recovery warning', () => {
    const raw = '{"version":1,"lines":[{"productId":"arc","finish":"graphite","quantity":2}]}';
    expect(STORAGE_KEY).toBe('sona.cart.v1');
    expect(loadCart(() => ({ getItem: key => key === STORAGE_KEY ? raw : null, setItem: () => {} }))).toEqual({
      lines: [{ productId: 'arc', finish: 'graphite', quantity: 2 }], status: 'available',
    });
  });
  it('merges only matching product and finish, deriving mixed prices from the catalog', () => {
    const parsed = parseCart(JSON.stringify({ version: 1, lines: [
      { productId: 'arc', finish: 'fig', quantity: 1, price: 1 },
      { productId: 'dot', finish: 'fig', quantity: 2, price: 1 },
      { productId: 'room', finish: 'fig', quantity: 1, price: 1 },
      { productId: 'dot', finish: 'pearl', quantity: 1, price: 999999 },
      { productId: 'dot', finish: 'fig', quantity: 1, price: 0 },
    ] }));
    expect(parsed.lines).toEqual([
      { productId: 'arc', finish: 'fig', quantity: 1 },
      { productId: 'dot', finish: 'fig', quantity: 3 },
      { productId: 'room', finish: 'fig', quantity: 1 },
      { productId: 'dot', finish: 'pearl', quantity: 1 },
    ]);
    expect(itemCount(parsed.lines)).toBe(6);
    expect(subtotal(parsed.lines)).toBe(119400);
    expect(parsed.recovered).toBe(true);
    expect(parsed.lines.map(line => variantKey(line.productId, line.finish))).toEqual(['arc:fig', 'dot:fig', 'room:fig', 'dot:pearl']);
  });
  it('discards null, scalar and malformed entries while keeping valid new products', () => {
    const parsed = parseCart(JSON.stringify({ version: 1, lines: [
      null, false, 3, 'dot', [], {},
      { productId: null, finish: 'pearl', quantity: 1 },
      { productId: 'dot', finish: null, quantity: 1 },
      { productId: 'room', finish: 'pearl', quantity: null },
      { productId: 'dot', finish: 'graphite', quantity: 0 },
      { productId: 'room', finish: 'pearl', quantity: Number.MAX_SAFE_INTEGER + 1 },
      { productId: 'dot', finish: 'graphite', quantity: 1 },
      { productId: 'room', finish: 'pearl', quantity: 1 },
    ] }));
    expect(parsed).toEqual({ lines: [
      { productId: 'dot', finish: 'graphite', quantity: 1 },
      { productId: 'room', finish: 'pearl', quantity: 1 },
    ], recovered: true });
  });
  it.each(['{', 'null', '[]', '{"version":2,"lines":[]}', '{"version":1,"lines":null}'])('recovers from malformed data: %s', raw => {
    expect(parseCart(raw)).toEqual({ lines: [], recovered: true });
  });
  it('distinguishes no saved data from invalid data', () => {
    expect(parseCart(null)).toEqual({ lines: [], recovered: false });
    expect(parseCart('{"version":1,"lines":[]}')).toEqual({ lines: [], recovered: false });
  });
  it('caps safe positive saved quantities and merged quantities at 99', () => {
    expect(parseCart('{"version":1,"lines":[{"productId":"arc","finish":"pearl","quantity":999}]}').lines[0].quantity).toBe(99);
    expect(parseCart(JSON.stringify({ version: 1, lines: [
      { productId: 'dot', finish: 'fig', quantity: 60 },
      { productId: 'dot', finish: 'fig', quantity: 60 },
      { productId: 'room', finish: 'fig', quantity: 2 },
    ] }))).toEqual({ lines: [
      { productId: 'dot', finish: 'fig', quantity: 99 },
      { productId: 'room', finish: 'fig', quantity: 2 },
    ], recovered: true });
  });
  it('round-trips a mixed cart using the existing storage key and schema', () => {
    const lines = parseCart('{"version":1,"lines":[{"productId":"dot","finish":"pearl","quantity":2},{"productId":"room","finish":"graphite","quantity":1}]}').lines;
    const saved = new Map<string, string>();
    const storage = () => ({ getItem: (key: string) => saved.get(key) ?? null, setItem: (key: string, value: string) => { saved.set(key, value); } });
    expect(saveCart(lines, storage)).toBe(true);
    expect([...saved.keys()]).toEqual(['sona.cart.v1']);
    expect(JSON.parse(saved.get(STORAGE_KEY)!)).toEqual({ version: 1, lines });
    expect(loadCart(storage)).toEqual({ lines, status: 'available' });
    expect(subtotal(loadCart(storage).lines)).toBe(64700);
  });
  it('survives a blocked storage getter, read, and write', () => {
    const throwingAccess = () => { throw new DOMException('blocked', 'SecurityError'); };
    expect(loadCart(throwingAccess)).toEqual({ lines: [], status: 'unavailable' });
    expect(saveCart([], throwingAccess)).toBe(false);
    expect(loadCart(() => ({ getItem: throwingAccess, setItem: () => {} })).status).toBe('unavailable');
    expect(saveCart([], () => ({ getItem: () => null, setItem: throwingAccess }))).toBe(false);
  });
});

describe('cart mutations', () => {
  it('keeps variants separate, derives totals, handles removal and announces the result', () => {
    let state: CartState = { lines: [], revision: 0, announcement: '' };
    for (const finish of ['fig', 'fig', 'pearl'] as const) state = cartReducer(state, { type: 'add', productId: 'arc', finish });
    expect(subtotal(state.lines)).toBe(74700);
    expect(state.lines).toHaveLength(2);
    state = cartReducer(state, { type: 'increase', productId: 'arc', finish: 'fig' });
    expect(state.lines[0].quantity).toBe(3);
    state = cartReducer(state, { type: 'decrease', productId: 'arc', finish: 'fig' });
    state = cartReducer(state, { type: 'remove', productId: 'arc', finish: 'pearl' });
    expect(subtotal(state.lines)).toBe(49800);
    state = cartReducer(state, { type: 'remove', productId: 'arc', finish: 'fig' });
    expect(state.lines).toEqual([]);
    expect(state.announcement).toContain('Your bag is empty.');
  });
  it('enforces limits without corrupting stored state', () => {
    const maximum: CartState = { lines: [{ productId: 'arc', finish: 'fig', quantity: 99 }], revision: 0, announcement: '' };
    expect(cartReducer(maximum, { type: 'add', productId: 'arc', finish: 'fig' }).lines[0].quantity).toBe(99);
    expect(cartReducer(maximum, { type: 'increase', productId: 'arc', finish: 'fig' }).revision).toBe(0);
    const minimum: CartState = { ...maximum, lines: [{ productId: 'arc', finish: 'fig', quantity: 1 }] };
    expect(cartReducer(minimum, { type: 'decrease', productId: 'arc', finish: 'fig' })).toBe(minimum);
  });
  it('targets quantity changes and removal by product as well as finish', () => {
    let state: CartState = { lines: [], revision: 0, announcement: '' };
    for (const productId of ['arc', 'dot', 'room'] as const) state = cartReducer(state, { type: 'add', productId, finish: 'pearl' });
    expect(state.lines).toHaveLength(3);
    expect(subtotal(state.lines)).toBe(74700);
    expect(state.announcement).toContain('Room in Pearl added.');
    const original = state;
    state = cartReducer(state, { type: 'increase', productId: 'dot', finish: 'pearl' });
    expect(state.lines.map(line => line.quantity)).toEqual([1, 2, 1]);
    expect(original.lines.map(line => line.quantity)).toEqual([1, 1, 1]);
    expect(state.announcement).toBe('Dot in Pearl, quantity 2. Bag: 4 items. Subtotal $896.');
    state = cartReducer(state, { type: 'decrease', productId: 'dot', finish: 'pearl' });
    state = cartReducer(state, { type: 'remove', productId: 'room', finish: 'pearl' });
    expect(state.lines.map(line => line.productId)).toEqual(['arc', 'dot']);
    expect(subtotal(state.lines)).toBe(39800);
    expect(state.announcement).toContain('Room in Pearl removed.');
    expect(state.revision).toBe(6);
    expect(cartReducer(state, { type: 'remove', productId: 'room', finish: 'pearl' })).toBe(state);
  });
  it('limits a specific variant without blocking another product in the same finish', () => {
    const state: CartState = { lines: [{ productId: 'dot', finish: 'fig', quantity: 99 }], revision: 8, announcement: '' };
    const capped = cartReducer(state, { type: 'add', productId: 'dot', finish: 'fig' });
    expect(capped.lines).toBe(state.lines);
    expect(capped.revision).toBe(8);
    expect(capped.announcement).toContain('maximum 99 Dot in Fig items');
    expect(cartReducer(state, { type: 'add', productId: 'room', finish: 'fig' }).lines).toEqual([
      { productId: 'dot', finish: 'fig', quantity: 99 },
      { productId: 'room', finish: 'fig', quantity: 1 },
    ]);
  });
  it('ignores invalid product or finish actions without changing the current cart', () => {
    const state: CartState = { lines: [{ productId: 'arc', finish: 'pearl', quantity: 1 }], revision: 1, announcement: 'Arc in Pearl added.' };
    for (const action of [
      { type: 'add', productId: 'unknown', finish: 'pearl' },
      { type: 'add', productId: 'dot', finish: 'unknown' },
      { type: 'remove', productId: null, finish: null },
    ]) expect(cartReducer(state, action as CartAction)).toBe(state);
  });
});
