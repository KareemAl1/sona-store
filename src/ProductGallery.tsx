import { useEffect, useRef, useState } from 'react';
import { finishName, finishes, productImage } from './catalog';
import type { Finish, Product } from './catalog';
import { useReducedMotion } from './useReducedMotion';

let openingPlayed = false;
export function ProductGallery({ item, finish, product }: { item: Product; finish: Finish; product: boolean }) {
  const frame = useRef<HTMLDivElement>(null);
  const previousProduct = useRef(product);
  const pendingEntry = useRef(product);
  const reduced = useReducedMotion();
  const [loaded, setLoaded] = useState<Finish[]>([]);
  const [failed, setFailed] = useState<Finish[]>([]);
  const [displayed, setDisplayed] = useState<Finish | null>(null);
  const pearlReady = loaded.includes('pearl');
  const hasImage = displayed !== null;

  // Selection and shopping never depend on loading or animation completion.
  useEffect(() => {
    if (loaded.includes(finish)) setDisplayed(finish);
  }, [finish, loaded]);

  useEffect(() => {
    const element = frame.current;
    if (reduced) openingPlayed = true;
    if (!element || product || reduced || !pearlReady || openingPlayed) return;
    let animation: Animation | undefined;
    const request = requestAnimationFrame(() => {
      openingPlayed = true;
      const mobile = window.matchMedia('(max-width: 700px)').matches;
      animation = element.animate([
        { transform: `translateY(${mobile ? 6 : 10}px) scale(${mobile ? 1.015 : 1.025})` },
        { transform: 'none' },
      ], { duration: mobile ? 360 : 520, easing: 'cubic-bezier(.22,1,.36,1)' });
      animation.id = 'sona-opening';
    });
    return () => { cancelAnimationFrame(request); animation?.cancel(); };
  }, [product, reduced, pearlReady]);

  useEffect(() => {
    const element = frame.current;
    const changed = previousProduct.current !== product;
    previousProduct.current = product; // Preference changes must not replay navigation.
    if (changed && product) pendingEntry.current = true;
    if (!element) return;
    if (changed || reduced) element.getAnimations().forEach(animation => animation.cancel());
    if (reduced) pendingEntry.current = false;
    if (reduced || !pendingEntry.current || !product || !hasImage) return;
    pendingEntry.current = false;
    element.getAnimations().forEach(animation => animation.cancel());
    const mobile = window.matchMedia('(max-width: 700px)').matches;
    // The phone's different composition uses a restrained destination reveal,
    // clipped to the gallery so new shopping controls remain available.
    const animation = element.animate(mobile
      ? [{ opacity: .82, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }]
      : [{ transform: 'scale(1.035)' }, { transform: 'none' }],
    { duration: mobile ? 220 : 340, easing: 'cubic-bezier(.22,1,.36,1)' });
    animation.id = 'sona-product-entry';
    return () => animation.cancel();
  }, [product, reduced, hasImage]);

  async function imageReady(image: HTMLImageElement, value: Finish) {
    try { await image.decode(); } catch { if (!image.naturalWidth) return; }
    setLoaded(current => current.includes(value) ? current : [...current, value]);
  }

  const pending = !loaded.includes(finish);
  const productId = item.id;
  const productName = item.name;
  const status = failed.includes(finish)
    ? `${finishName(finish)} preview unavailable. You can still choose this finish.`
    : `Loading ${finishName(finish)} preview…`;

  return <figure className={`product-gallery ${product ? 'product-gallery--detail' : ''}`}>
    <div className="product-gallery__images" ref={frame}>
      {finishes.map(item => <picture key={item.id} className="finish-image" data-finish={item.id} data-active={item.id === displayed}>
        <source srcSet={`${productImage(productId, item.id, 'small')} 550w, ${productImage(productId, item.id)} 1100w`} sizes="(max-width: 700px) 100vw, 50vw" type="image/webp" />
        <img src={productImage(productId, item.id)} width="1100" height="1100" alt={item.id === displayed ? `Sona ${productName} in ${item.name}, in a plum studio` : ''} aria-hidden={item.id !== displayed} fetchPriority={item.id === 'pearl' ? 'high' : 'low'} onLoad={event => void imageReady(event.currentTarget, item.id)} onError={() => setFailed(current => current.includes(item.id) ? current : [...current, item.id])} />
      </picture>)}
    </div>
    {pending && <p className={`image-status ${displayed ? 'image-status--retained' : ''}`} role="status">{status}{displayed && ` Showing ${finishName(displayed)}.`}</p>}
    <figcaption><span>{item.name} / {finishName(displayed ?? finish)}</span><span>{item.number} — Sona</span></figcaption>
  </figure>;
}
