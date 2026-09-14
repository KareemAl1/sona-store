export const finishes = [
  { id: 'pearl', name: 'Pearl', color: '#dcdad2' },
  { id: 'graphite', name: 'Graphite', color: '#3b3b3c' },
  { id: 'fig', name: 'Fig', color: '#5a445f' },
] as const;
export type Finish = (typeof finishes)[number]['id'];
export const arc = { id: 'arc', name: 'Arc', price: 24900, type: 'Over-ear headphones' } as const;
export const MAX_QUANTITY = 99;
export const money = (cents: number) => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', maximumFractionDigits: 0,
}).format(cents / 100);
export const isFinish = (value: unknown): value is Finish => finishes.some(finish => finish.id === value);
export const resolveFinish = (value: string | null): Finish => isFinish(value) ? value : 'pearl';
export const finishName = (finish: Finish) => finishes.find(item => item.id === finish)!.name;
export const productImage = (finish: Finish, size: 'large' | 'small' = 'large') => `/images/arc-${finish}-${size === 'large' ? 1100 : 550}.webp`;
