export const finishes = [
  { id: 'pearl', name: 'Pearl', color: '#dcdad2' },
  { id: 'graphite', name: 'Graphite', color: '#3b3b3c' },
  { id: 'fig', name: 'Fig', color: '#5a445f' },
] as const;
export type Finish = (typeof finishes)[number]['id'];
export const productIds = ['arc', 'dot', 'room'] as const;
export type ProductId = (typeof productIds)[number];
export type Product = {
  id: ProductId; name: string; number: string; price: number; type: string;
  introduction: string; description: string; form: string; setting: string; portability: string;
  detailTitle: string; detailCopy: string; detailAlt: string; design: string;
};
export const products: Record<ProductId, Product> = {
  arc: {
    id: 'arc', name: 'Arc', number: '01', price: 24900, type: 'Over-ear headphones',
    introduction: 'A little space for yourself.',
    description: 'A sculpted oval shell. A soft fabric cushion. A form made for your listening ritual.',
    form: 'Over-ear, with a padded headband', setting: 'At your desk or away from it', portability: 'Carry-along headphones',
    detailTitle: 'A closer look at the everyday.',
    detailCopy: 'Woven texture. A sewn edge. A closer look at the cushion, where fabric meets metal.',
    detailAlt: 'Macro view inside Arc’s woven ear cushion, with its stitched rim and contrasting metal frame',
    design: 'Arc pairs an oval outer shell with a broad padded headband and a forked metal yoke. The woven cushions contrast with the smooth shell.',
  },
  dot: {
    id: 'dot', name: 'Dot', number: '02', price: 14900, type: 'Wireless earbuds & case',
    introduction: 'Small objects. Everyday company.',
    description: 'Two compact forms, nested in a softly rounded case. A pocket-sized part of the collection.',
    form: 'In-ear pair with a charging case', setting: 'Commuting and everyday outings', portability: 'Pocket-sized case',
    detailTitle: 'A place for every curve.',
    detailCopy: 'A molded cradle. A soft silicone tip. Satin trim traces the small form of each earbud.',
    detailAlt: 'Macro view of Dot’s silicone ear tip, satin metal trim, and molded case cradle',
    design: 'Dot uses two sculpted earbuds and an open, rounded charging case. Recessed wells, soft tips, and a contrasting hinge give each small part its own place.',
  },
  room: {
    id: 'room', name: 'Room', number: '03', price: 34900, type: 'Home speaker',
    introduction: 'An object to live with.',
    description: 'A woven face, a rounded silhouette, and a considered place on the shelf. Meet the collection’s home speaker.',
    form: 'Sculptural speaker with a woven face', setting: 'Shelves, side tables, and living spaces', portability: 'Designed as a home object',
    detailTitle: 'Texture, given a little room.',
    detailCopy: 'A woven surface meets a smooth frame. The fine perimeter and metal control make the contrast visible.',
    detailAlt: 'Close view of Room’s woven face, smooth frame, and inset metal top control',
    design: 'Room brings a softly rounded vertical form together with an inset woven front and a shallow metal top control. Its surfaces share the collection’s material language.',
  },
};
export const arc = products.arc;
export const MAX_QUANTITY = 99;
export const money = (cents: number) => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', maximumFractionDigits: 0,
}).format(cents / 100);
export const isFinish = (value: unknown): value is Finish => finishes.some(finish => finish.id === value);
export const isProductId = (value: unknown): value is ProductId => productIds.some(id => id === value);
export const resolveFinish = (value: string | null): Finish => isFinish(value) ? value : 'pearl';
export const finishName = (finish: Finish) => finishes.find(item => item.id === finish)!.name;
export const productImage = (id: ProductId, finish: Finish, size: 'large' | 'small' = 'large') => `/images/${id}-${finish}-${size === 'large' ? 1100 : 550}.webp`;
export const productUrl = (id: ProductId, finish: Finish = 'pearl') => `/products/${id}?finish=${finish}`;
export const productFromPath = (pathname: string): Product | undefined => {
  const id = pathname.match(/^\/products\/([^/]+)\/?$/)?.[1];
  return isProductId(id) ? products[id] : undefined;
};
export function comparisonIds(value: string | null): ProductId[] {
  return value === null ? [...productIds] : [...new Set(value.split(',').filter(isProductId))].slice(0, 3);
}
