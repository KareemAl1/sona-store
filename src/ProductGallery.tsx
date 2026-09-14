import { useEffect, useRef, useState } from 'react';
import { finishName, finishes, productImage } from './catalog';
import type { Finish } from './catalog';
import { useReducedMotion } from './useReducedMotion';

let openingPlayed = false;
export function ProductGallery({ finish, product }: { finish: Finish; product: boolean }) {
  const frame = useRef<HTMLDivElement>(null);
  const previousProduct = useRef(product);
  const reduced = useReducedMotion();
  const [loaded, setLoaded] = useState<Finish[]>([]);
  const [failed, setFailed] = useState<Finish[]>([]);
  useEffect(() => {
    const element = frame.current;
    if (!element || reduced) { element?.getAnimations().forEach(animation => animation.cancel()); if (reduced) openingPlayed = true; return; }
    const mobile = window.matchMedia('(max-width: 700px)').matches;
    let animation: Animation | undefined;
    let request = 0;
    if (!product && !openingPlayed) {
      request = requestAnimationFrame(() => {
        openingPlayed = true;
        animation = element.animate([{ transform: `translateY(${mobile ? 6 : 12}px) scale(${mobile ? 1 : 1.02})` }, { transform: 'none' }], { duration: mobile ? 300 : 480, easing: 'cubic-bezier(.22,1,.36,1)' });
      });
    } else if (product && !previousProduct.current) {
      animation = element.animate(mobile ? [{ opacity: .75 }, { opacity: 1 }] : [{ transform: 'scale(1.045)' }, { transform: 'none' }], { duration: mobile ? 180 : 320, easing: 'cubic-bezier(.22,1,.36,1)' });
    }
    previousProduct.current = product;
    return () => { cancelAnimationFrame(request); animation?.cancel(); };
  }, [product, reduced]);
  return <figure className={`product-gallery ${product ? 'product-gallery--detail' : ''}`}>
    <div className="product-gallery__images" ref={frame}>
      {finishes.map(item => <picture key={item.id} className="finish-image" data-active={item.id === finish && loaded.includes(item.id)}>
        <source srcSet={`${productImage(item.id, 'small')} 550w, ${productImage(item.id)} 1100w`} sizes="(max-width: 700px) 100vw, 50vw" type="image/webp" />
        <img src={productImage(item.id)} width="1100" height="1100" alt={item.id === finish ? `Sona Arc in ${item.name}, resting on a plum studio plinth` : ''} aria-hidden={item.id !== finish} fetchPriority={item.id === 'pearl' ? 'high' : 'low'} onLoad={() => setLoaded(current => current.includes(item.id) ? current : [...current, item.id])} onError={() => setFailed(current => current.includes(item.id) ? current : [...current, item.id])} />
      </picture>)}
    </div>
    {!loaded.includes(finish) && <p className="image-status" role="status">{failed.includes(finish) ? `${finishName(finish)} preview unavailable. You can still choose this finish.` : `Loading ${finishName(finish)} preview…`}</p>}
    <figcaption><span>Arc / {finishName(finish)}</span><span>01 — Sona</span></figcaption>
  </figure>;
}
