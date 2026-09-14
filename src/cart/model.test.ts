import { describe, expect, it } from 'vitest';
import { cartReducer, loadCart, parseCart, saveCart, subtotal } from './model';
import type { CartState } from './model';

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
  it.each(['{', 'null', '[]', '{"version":2,"lines":[]}', '{"version":1,"lines":null}'])('recovers from malformed data: %s', raw => {
    expect(parseCart(raw)).toEqual({ lines: [], recovered: true });
  });
  it('distinguishes no saved data from invalid data', () => {
    expect(parseCart(null)).toEqual({ lines: [], recovered: false });
    expect(parseCart('{"version":1,"lines":[]}')).toEqual({ lines: [], recovered: false });
  });
  it('caps safe positive saved quantities and merged quantities at 99', () => {
    expect(parseCart('{"version":1,"lines":[{"productId":"arc","finish":"pearl","quantity":999}]}').lines[0].quantity).toBe(99);
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
    for (const finish of ['fig', 'fig', 'pearl'] as const) state = cartReducer(state, { type: 'add', finish });
    expect(subtotal(state.lines)).toBe(74700);
    expect(state.lines).toHaveLength(2);
    state = cartReducer(state, { type: 'increase', finish: 'fig' });
    expect(state.lines[0].quantity).toBe(3);
    state = cartReducer(state, { type: 'decrease', finish: 'fig' });
    state = cartReducer(state, { type: 'remove', finish: 'pearl' });
    expect(subtotal(state.lines)).toBe(49800);
    state = cartReducer(state, { type: 'remove', finish: 'fig' });
    expect(state.lines).toEqual([]);
    expect(state.announcement).toContain('Your bag is empty.');
  });
  it('enforces limits without corrupting stored state', () => {
    const maximum: CartState = { lines: [{ productId: 'arc', finish: 'fig', quantity: 99 }], revision: 0, announcement: '' };
    expect(cartReducer(maximum, { type: 'add', finish: 'fig' }).lines[0].quantity).toBe(99);
    expect(cartReducer(maximum, { type: 'increase', finish: 'fig' }).revision).toBe(0);
    const minimum: CartState = { ...maximum, lines: [{ productId: 'arc', finish: 'fig', quantity: 1 }] };
    expect(cartReducer(minimum, { type: 'decrease', finish: 'fig' })).toBe(minimum);
  });
});
