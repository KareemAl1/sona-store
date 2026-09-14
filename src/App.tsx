import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useNavigationType, useSearchParams } from 'react-router';
import { arc, finishName, finishes, MAX_QUANTITY, money, productImage, resolveFinish } from './catalog';
import type { Finish } from './catalog';
import { useCart } from './cart/CartProvider';
import { ProductGallery } from './ProductGallery';
import { useBagInspection } from './useBagInspection';

const scrollPositions = new Map<string, number>();
const overlayKeys = new Set<string>();

export function App() {
  useBagInspection();
  const location = useLocation();
  const navigationType = useNavigationType();
  const navigate = useNavigate();
  const [search, setSearch] = useSearchParams();
  const product = location.pathname === '/products/arc';
  const home = location.pathname === '/';
  const finish = product ? resolveFinish(search.get('finish')) : 'pearl';
  const bagOpen = search.get('cart') === 'open';
  const cart = useCart();
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const openerPath = useRef(location.pathname);
  const priorPath = useRef(location.pathname);
  const [confirmation, setConfirmation] = useState<{ finish: Finish; full: boolean } | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => { window.history.scrollRestoration = previous; };
  }, []);

  // Route changes manage document focus and scroll. Finish/cart query changes never reset either.
  useLayoutEffect(() => {
    const previous = priorPath.current;
    priorPath.current = location.pathname;
    if (previous !== location.pathname) {
      const top = navigationType === 'POP' ? scrollPositions.get(location.key) ?? 0 : 0;
      window.scrollTo({ top, behavior: 'instant' });
      // Let the modal close first; a heading behind an open dialog is inert.
      if (!bagOpen) requestAnimationFrame(() => heading.current?.focus({ preventScroll: true }));
      setConfirmation(null);
    }
    return () => { scrollPositions.set(location.key, window.scrollY); };
  }, [location.key, location.pathname, navigationType]);

  useEffect(() => {
    document.title = product ? `Arc in ${finishName(finish)} — Sona` : home ? 'Sona — The Listening Room' : 'Page not found — Sona';
  }, [product, home, finish]);

  useEffect(() => { setConfirmation(current => current?.finish === finish ? current : null); }, [finish]);

  // A tab-local key makes Close history-safe even after reload or on a directly opened URL.
  useEffect(() => {
    if (bagOpen && location.state?.sonaCartOrigin && location.state.sonaCartOrigin === opener.current?.dataset.cartOrigin) overlayKeys.add(location.key);
  }, [bagOpen, location.key, location.state]);

  useLayoutEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (bagOpen) {
      if (!element.open) element.showModal();
      document.body.style.overflow = 'hidden';
      closeButton.current?.focus();
    } else if (!bagOpen && element.open) {
      element.close();
      document.body.style.overflow = '';
      if (opener.current?.isConnected && openerPath.current === location.pathname) opener.current.focus({ preventScroll: true });
      else heading.current?.focus({ preventScroll: true });
    }
    return () => { document.body.style.overflow = ''; };
  }, [bagOpen]);

  function openBag() {
    if (bagOpen) return;
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    openerPath.current = location.pathname;
    const params = new URLSearchParams(search);
    params.set('cart', 'open');
    if (opener.current) opener.current.dataset.cartOrigin = location.key;
    navigate({ pathname: location.pathname, search: params.toString() }, { state: { sonaCartOrigin: location.key } });
  }

  function closeBag() {
    if (overlayKeys.has(location.key)) navigate(-1);
    else {
      const params = new URLSearchParams(search);
      params.delete('cart');
      navigate({ pathname: location.pathname, search: params.toString() }, { replace: true, state: null });
    }
  }

  function chooseFinish(next: Finish) {
    const params = new URLSearchParams(window.location.search);
    if (next === resolveFinish(params.get('finish'))) return;
    params.set('finish', next);
    setConfirmation(null);
    setSearch(params); // One intentional history entry per selection; Back restores the prior finish.
  }

  function addToBag() {
    // History updates synchronously, even if a router render is still pending.
    const chosen = resolveFinish(new URLSearchParams(window.location.search).get('finish'));
    const full = cart.lines.some(line => line.finish === chosen && line.quantity === MAX_QUANTITY);
    cart.dispatch({ type: 'add', finish: chosen });
    setConfirmation({ finish: chosen, full });
  }

  function removeLine(target: Finish) {
    const index = cart.lines.findIndex(line => line.finish === target);
    const nextFinish = cart.lines[index + 1]?.finish ?? cart.lines[index - 1]?.finish;
    cart.dispatch({ type: 'remove', finish: target });
    requestAnimationFrame(() => {
      const next = nextFinish ? dialog.current?.querySelector<HTMLButtonElement>(`[data-remove="${nextFinish}"]`) : dialog.current?.querySelector<HTMLButtonElement>('.empty-bag__action');
      (next ?? closeButton.current)?.focus();
    });
  }

  function containDialogFocus(event: React.KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== 'Tab') return;
    const controls = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')).filter(control => control.offsetParent !== null);
    const first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }

  const notice = confirmation && <div className="add-confirmation"><span>{confirmation.full ? 'Maximum quantity reached.' : `Arc in ${finishName(confirmation.finish)} added.`}</span><button className="text-button" onClick={openBag}>View bag</button></div>;

  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="site-header"><div className="site-header__inner">
      <Link className="wordmark" to="/" aria-label="Sona home">sona</Link>
      <nav aria-label="Main navigation"><span className="brand-note">Objects for listening.</span><button className="bag-toggle" onClick={openBag} aria-label={`Open bag, ${cart.count} ${cart.count === 1 ? 'item' : 'items'}`} aria-haspopup="dialog">Bag <span aria-hidden="true">({cart.count})</span></button></nav>
    </div></header>

    {product && <div className="mobile-purchase"><div><span>Arc / {finishName(finish)}</span><span>{money(arc.price)}</span></div><div className="mobile-purchase__actions">{confirmation && <button className="text-button" onClick={openBag}>View bag</button>}<button className="button button--compact" onClick={addToBag}>{confirmation ? 'Add another' : 'Add to bag'}</button></div></div>}

    <main id="main" className="site-main" tabIndex={-1}>
      {home || product ? <>
        <section className={`hero ${product ? 'hero--product' : ''}`} aria-label={product ? 'Shop Arc' : 'Introducing Arc'}>
          <div className="hero-copy">
            {home ? <>
              <p className="eyebrow">Introducing Arc</p>
              <h1 ref={heading} tabIndex={-1}>Make room<br />for <em>listening.</em></h1>
              <p className="hero-description">Over-ear headphones.<br />Three finishes. Your own space.</p>
              <div><Link className="button" to="/products/arc?finish=pearl">Discover Arc <span aria-hidden="true">↗</span></Link><p className="concept-price">{money(arc.price)} · Concept price</p></div>
              <div className="hero-footer"><span>Sona — The Listening Room</span><span>Shape, texture<br />and a little space.</span></div>
            </> : <>
              <Link className="back-link" to="/">← Back to the collection</Link>
              <div className="product-title"><h1 ref={heading} tabIndex={-1}>Arc</h1><span>{money(arc.price)}</span></div>
              <p className="product-type">{arc.type}</p>
              <p className="product-description">A sculpted oval shell. A soft fabric cushion. A form made for your listening ritual.</p>
              <fieldset className="finish-picker"><legend>Finish: <strong>{finishName(finish)}</strong></legend><div className="finish-options">{finishes.map(item => <label className="finish-option" key={item.id}><input type="radio" name="finish" value={item.id} checked={finish === item.id} onChange={() => chooseFinish(item.id)} /><span className={`finish-swatch ${item.id !== 'pearl' ? 'finish-swatch--dark' : ''}`} style={{ backgroundColor: item.color }} aria-hidden="true">{finish === item.id ? '✓' : ''}</span><span>{item.name}</span></label>)}</div></fieldset>
              <div className="purchase-block"><button className="button button--wide" onClick={addToBag}>Add to bag <span>{money(arc.price)}</span></button><div className="confirmation-space">{notice}</div><StorageNotice status={cart.status} /></div>
            </>}
          </div>
          <ProductGallery finish={finish} product={product} />
        </section>
        <section className="material-story" aria-labelledby="material-heading"><div><p className="eyebrow">The details</p><h2 id="material-heading">A closer look<br />at the everyday.</h2><p>The curve of a headband. The edge of a cushion. Small details, given room to be seen.</p><p className="secondary-note">Original fictional product study.</p></div><figure><img src="/images/arc-detail.webp" width="1100" height="700" loading="lazy" alt="Close view of Arc’s original headband, sculpted yoke, and fabric cushion" /><figcaption><span>Arc / Material study</span><span>Sona</span></figcaption></figure></section>
        {product && <section className="design-details"><button aria-expanded={detailsOpen} aria-controls="design-details-content" onClick={() => setDetailsOpen(!detailsOpen)}><span>Design details</span><span aria-hidden="true">{detailsOpen ? '−' : '+'}</span></button><div id="design-details-content" hidden={!detailsOpen}><p>Arc pairs an oval outer shell with a broad headband and a forked yoke. Choose Pearl, Graphite, or Fig; each finish shares the same original form.</p><p>This is a fictional design study. The price is illustrative; no audio performance, battery life, or manufacturing claims are made.</p></div></section>}
      </> : <section className="not-found"><p className="eyebrow">Page not found</p><h1 ref={heading} tabIndex={-1}>A little off track.</h1><Link className="button" to="/">Return to Sona <span aria-hidden="true">↗</span></Link></section>}
    </main>
    <footer className="site-footer"><Link className="wordmark" to="/" aria-label="Sona home">sona</Link><p>Fictional products. Portfolio concept. No payments.</p></footer>

    <dialog className="cart-dialog" ref={dialog} aria-labelledby="cart-heading" onKeyDown={containDialogFocus} onCancel={event => { event.preventDefault(); closeBag(); }} onClick={event => { if (event.target === dialog.current) { const rect = dialog.current.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeBag(); } }}>
      <div className="cart-header"><h2 id="cart-heading">Your bag</h2><button className="text-button cart-close" ref={closeButton} onClick={closeBag} aria-label="Close bag">Close <span aria-hidden="true">×</span></button></div>
      <div className="cart-content"><StorageNotice status={cart.status} />
        {cart.lines.length ? <><ul className="cart-lines">{cart.lines.map(line => <li className="cart-line" key={line.finish}>
          <img className="cart-line__image" src={productImage(line.finish, 'small')} width="550" height="750" alt={`Arc in ${finishName(line.finish)}`} />
          <div className="cart-line__details"><div className="cart-line__title"><h3>Arc</h3><span>{money(arc.price * line.quantity)}</span></div><p>{finishName(line.finish)}</p><div className="quantity-controls"><div className="quantity-stepper"><button onClick={() => cart.dispatch({ type: 'decrease', finish: line.finish })} disabled={line.quantity === 1} aria-label={`Decrease ${finishName(line.finish)} quantity`}>−</button><span aria-label={`Quantity ${line.quantity}`}>{line.quantity}</span><button onClick={() => cart.dispatch({ type: 'increase', finish: line.finish })} disabled={line.quantity === MAX_QUANTITY} aria-label={`Increase ${finishName(line.finish)} quantity`}>+</button></div><button className="text-button remove-item" data-remove={line.finish} onClick={() => removeLine(line.finish)} aria-label={`Remove Arc in ${finishName(line.finish)}`}>Remove</button></div>{line.quantity === MAX_QUANTITY && <p className="quantity-limit">Maximum {MAX_QUANTITY} per finish.</p>}</div>
        </li>)}</ul><div className="cart-summary"><div className="subtotal"><span>Subtotal</span><strong>{money(cart.total)}</strong></div><p>Fictional products and prices.<br />This portfolio concept does not take orders or payments.</p><button className="button button--wide" onClick={closeBag}>Continue exploring <span aria-hidden="true">↗</span></button></div></> : <div className="empty-bag"><span className="empty-bag__mark" aria-hidden="true">s</span><h3>A little room<br />for listening.</h3><p>Your bag is empty.</p><button className="button button--wide empty-bag__action" onClick={() => { if (product) closeBag(); else navigate('/products/arc?finish=pearl'); }}>Explore Arc <span aria-hidden="true">↗</span></button><p className="secondary-note">Fictional products. No payments.</p></div>}
      </div>
      <p className="sr-only" aria-live="polite" aria-atomic="true">{cart.announcement}</p>
    </dialog>
    <p className="sr-only" role="status" aria-live={bagOpen ? 'off' : 'polite'} aria-atomic="true">{cart.announcement}</p>
  </>;
}

function StorageNotice({ status }: { status: 'available' | 'unavailable' | 'recovered' }) {
  if (status === 'available') return null;
  return <p className="storage-notice" role="status">{status === 'unavailable' ? 'Your bag works for this visit. This browser isn’t allowing it to be saved, so it may reset after a reload.' : 'Some saved bag data couldn’t be restored. Your available items are shown.'}</p>;
}
