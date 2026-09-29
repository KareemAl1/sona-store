import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useNavigationType, useSearchParams } from 'react-router';
import { arc, finishName, finishes, MAX_QUANTITY, money, productFromPath, productIds, productImage, products, productUrl, resolveFinish } from './catalog';
import type { Finish, ProductId } from './catalog';
import { useCart } from './cart/CartProvider';
import { variantKey } from './cart/model';
import { ProductGallery } from './ProductGallery';
import { useBagInspection } from './useBagInspection';
import { Collection, ComparisonPage } from './Collection';

const scrollPositions = new Map<string, number>();
const overlayKeys = new Set<string>();

export function App() {
  useBagInspection();
  const location = useLocation();
  const navigationType = useNavigationType();
  const navigate = useNavigate();
  const [search, setSearch] = useSearchParams();
  const product = productFromPath(location.pathname);
  const item = product ?? arc;
  const home = location.pathname === '/';
  const comparing = location.pathname === '/compare';
  const finish = product ? resolveFinish(search.get('finish')) : 'pearl';
  const bagOpen = search.get('cart') === 'open';
  const cart = useCart();
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const openerPath = useRef(location.pathname);
  const priorRoute = useRef<typeof location | null>(null);
  const backdropPressed = useRef(false);
  const [confirmation, setConfirmation] = useState<{ productId: ProductId; finish: Finish; full: boolean } | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => { window.history.scrollRestoration = previous; };
  }, []);

  // Explicit collection links target the section. History restores the visited
  // position instead; changing only a cart/finish query never retargets focus.
  useLayoutEffect(() => {
    const previous = priorRoute.current;
    priorRoute.current = location;
    const pathChanged = previous !== null && previous.pathname !== location.pathname;
    const hashChanged = previous !== null && previous.hash !== location.hash;
    const restoreHashPosition = hashChanged && navigationType === 'POP' && scrollPositions.has(location.key);
    const repeatedLink = previous !== null && previous.key !== location.key && previous.search === location.search;
    const collectionRequested = home && location.hash === '#collection'
      && (previous === null || (navigationType !== 'POP' && (pathChanged || hashChanged || repeatedLink)));
    let focusRequest: number | undefined;
    if (collectionRequested) {
      const collection = document.getElementById('collection');
      collection?.scrollIntoView({ behavior: 'instant' });
      if (!bagOpen) collection?.focus({ preventScroll: true });
    } else if (pathChanged || restoreHashPosition) {
      const top = navigationType === 'POP' ? scrollPositions.get(location.key) ?? 0 : 0;
      window.scrollTo({ top, behavior: 'instant' });
      // Let the modal close first; a heading behind an open dialog is inert.
      if (!bagOpen && (pathChanged || !location.hash)) focusRequest = requestAnimationFrame(() => heading.current?.focus({ preventScroll: true }));
    }
    if (pathChanged) {
      setConfirmation(null);
      setDetailsOpen(false);
    }
    // Record while this route is still on screen. Cleanup runs after React has
    // replaced its DOM, when a shorter destination may already clamp scrollY.
    const rememberPosition = () => { scrollPositions.set(location.key, window.scrollY); };
    rememberPosition();
    window.addEventListener('scroll', rememberPosition, { passive: true });
    return () => {
      if (focusRequest !== undefined) cancelAnimationFrame(focusRequest);
      window.removeEventListener('scroll', rememberPosition);
    };
  }, [location.key, location.pathname, location.hash, location.search, navigationType]);

  useEffect(() => {
    document.title = product ? `${product.name} in ${finishName(finish)} — Sona` : home ? 'Sona — The Listening Room' : comparing ? 'Compare the collection — Sona' : 'Page not found — Sona';
  }, [product, home, comparing, finish]);

  useEffect(() => { setConfirmation(current => current?.finish === finish && current.productId === product?.id ? current : null); }, [finish, product]);

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
    navigate({ pathname: location.pathname, search: params.toString(), hash: location.hash }, { state: { sonaCartOrigin: location.key } });
  }

  function closeBag() {
    if (overlayKeys.has(location.key)) navigate(-1);
    else {
      const params = new URLSearchParams(search);
      params.delete('cart');
      navigate({ pathname: location.pathname, search: params.toString(), hash: location.hash }, { replace: true, state: null });
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
    const chosenProduct = productFromPath(window.location.pathname);
    if (!chosenProduct) return;
    const chosen = resolveFinish(new URLSearchParams(window.location.search).get('finish'));
    const full = cart.lines.some(line => line.productId === chosenProduct.id && line.finish === chosen && line.quantity === MAX_QUANTITY);
    cart.dispatch({ type: 'add', productId: chosenProduct.id, finish: chosen });
    setConfirmation({ productId: chosenProduct.id, finish: chosen, full });
  }

  function removeLine(productId: ProductId, target: Finish) {
    const index = cart.lines.findIndex(line => line.productId === productId && line.finish === target);
    const nextLine = cart.lines[index + 1] ?? cart.lines[index - 1];
    cart.dispatch({ type: 'remove', productId, finish: target });
    requestAnimationFrame(() => {
      const next = nextLine ? dialog.current?.querySelector<HTMLButtonElement>(`[data-remove="${variantKey(nextLine.productId, nextLine.finish)}"]`) : dialog.current?.querySelector<HTMLButtonElement>('.empty-bag__action');
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

  function isBackdrop(event: React.PointerEvent<HTMLDialogElement> | React.MouseEvent<HTMLDialogElement>) {
    if (event.target !== dialog.current || !dialog.current) return false;
    const rect = dialog.current.getBoundingClientRect();
    return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
  }

  const notice = confirmation && <div className="add-confirmation"><span>{confirmation.full ? 'Maximum quantity reached.' : `${products[confirmation.productId].name} in ${finishName(confirmation.finish)} added.`}</span><button className="text-button" onClick={openBag}>View bag</button></div>;

  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="site-header"><div className="site-header__inner">
      <Link className="wordmark" to="/" aria-label="Sona home">sona</Link>
      <nav aria-label="Main navigation"><Link className="shop-link" to="/#collection" aria-current={home ? 'page' : undefined}>Collection</Link><Link className="shop-link" to="/compare" aria-current={comparing ? 'page' : undefined}>Compare</Link><button className="bag-toggle" onClick={openBag} aria-label={`Open bag, ${cart.count} ${cart.count === 1 ? 'item' : 'items'}`} aria-haspopup="dialog">Bag <span aria-hidden="true">({cart.count})</span></button></nav>
    </div></header>

    {product && <div className="mobile-purchase"><div><span>{item.name} / {finishName(finish)}</span><span>{money(item.price)} <span className="price-note">concept</span></span></div><div className="mobile-purchase__actions">{confirmation && <button className="text-button" onClick={openBag}>View bag</button>}<button className="button button--compact" onClick={addToBag}>{confirmation ? 'Add another' : 'Add to bag'}</button></div></div>}

    <main id="main" className="site-main" tabIndex={-1}>
      {home || product ? <>
        <section className={`hero ${product ? 'hero--product' : ''}`} aria-label={product ? `Shop ${item.name}` : 'Introducing Arc'}>
          <div className="hero-copy">
            {home ? <>
              <p className="eyebrow">The Sona collection</p>
              <h1 ref={heading} tabIndex={-1}>Make room<br />for <em>listening.</em></h1>
              <p className="hero-description">Three objects. One listening room.</p>
              <div className="hero-shopping"><Link className="button" to="/products/arc?finish=pearl">Discover Arc <span aria-hidden="true">↗</span></Link><p className="concept-price"><span>{money(arc.price)}</span><span>Concept price</span></p></div>
              <div className="hero-footer"><span>Sona — The Listening Room</span><span>Shape, texture<br />and a little space.</span></div>
            </> : <>
              <Link className="back-link" to="/#collection">← Back to the collection</Link>
              <nav className="product-navigation" aria-label="Products">{productIds.map(id => <Link key={id} to={productUrl(id)} aria-current={item.id === id ? 'page' : undefined}>{products[id].name}</Link>)}</nav>
              <div className="product-title"><h1 ref={heading} tabIndex={-1}>{item.name}</h1><div className="product-price"><span>{money(item.price)}</span><span>Concept price</span></div></div>
              <p className="product-type">{item.type}</p>
              <p className="product-description">{item.description}</p>
              <fieldset className="finish-picker"><legend>Finish: <strong>{finishName(finish)}</strong></legend><div className="finish-options">{finishes.map(item => <label className="finish-option" key={item.id}><input type="radio" name="finish" value={item.id} checked={finish === item.id} onChange={() => chooseFinish(item.id)} /><span className={`finish-swatch ${item.id !== 'pearl' ? 'finish-swatch--dark' : ''}`} style={{ backgroundColor: item.color }} aria-hidden="true">{finish === item.id ? '✓' : ''}</span><span>{item.name}</span></label>)}</div></fieldset>
              <div className="purchase-block"><button className="button button--wide" onClick={addToBag}>Add to bag <span>{money(item.price)}</span></button><div className="confirmation-space">{notice}</div><StorageNotice status={cart.status} /></div>
              <Link className="compare-product" to={`/compare?items=${item.id}`}>Compare {item.name} with the collection ↗</Link>
            </>}
          </div>
          <ProductGallery key={item.id} item={item} finish={finish} product={!!product} />
        </section>
        {home && <Collection />}
        <section className="material-story" aria-labelledby="material-heading"><div><p className="eyebrow">The details</p><h2 id="material-heading">{item.id === 'arc' ? <>A closer look<br />at the everyday.</> : item.detailTitle}</h2><p>{item.detailCopy}</p><p className="secondary-note">Original fictional product study.</p></div><figure><img src={`/images/${item.id}-detail.webp`} width="1100" height="786" loading="lazy" alt={item.detailAlt} /><figcaption><span>{item.name} / Material study</span><span>Sona</span></figcaption></figure></section>
        {product && <section className="design-details"><button aria-expanded={detailsOpen} aria-controls="design-details-content" onClick={() => setDetailsOpen(!detailsOpen)}><span>Design details</span><span aria-hidden="true">{detailsOpen ? '−' : '+'}</span></button><div id="design-details-content" hidden={!detailsOpen}><p>{item.design} Choose Pearl, Graphite, or Fig; each finish shares the same original form.</p><p>This is a fictional design study. The price is illustrative; no audio performance, battery life, or manufacturing claims are made.</p></div></section>}
      </> : comparing ? <ComparisonPage headingRef={heading} /> : <section className="not-found"><p className="eyebrow">Page not found</p><h1 ref={heading} tabIndex={-1}>A little off track.</h1><p>The collection is a good place to start.</p><Link className="button" to="/#collection">Explore the collection <span aria-hidden="true">↗</span></Link></section>}
    </main>
    <footer className="site-footer"><Link className="wordmark" to="/" aria-label="Sona home">sona</Link><p>Fictional products. Portfolio concept. No payments.</p></footer>

    <dialog className="cart-dialog" ref={dialog} aria-labelledby="cart-heading" onKeyDown={containDialogFocus} onCancel={event => { event.preventDefault(); closeBag(); }} onPointerDown={event => { backdropPressed.current = event.button === 0 && isBackdrop(event); }} onPointerCancel={() => { backdropPressed.current = false; }} onClick={event => { const dismiss = backdropPressed.current && isBackdrop(event); backdropPressed.current = false; if (dismiss) closeBag(); }}>
      <div className="cart-header"><h2 id="cart-heading">Your bag</h2><button className="text-button cart-close" ref={closeButton} onClick={closeBag} aria-label="Close bag">Close <span aria-hidden="true">×</span></button></div>
      <div className="cart-content"><StorageNotice status={cart.status} />
        {cart.lines.length ? <><ul className="cart-lines">{cart.lines.map(line => <li className="cart-line" key={variantKey(line.productId, line.finish)} data-variant={variantKey(line.productId, line.finish)}>
          <img className="cart-line__image" src={productImage(line.productId, line.finish, 'small')} width="550" height="550" alt={`${products[line.productId].name} in ${finishName(line.finish)}`} />
          <div className="cart-line__details"><div className="cart-line__title"><h3>{products[line.productId].name}</h3><span>{money(products[line.productId].price * line.quantity)}</span></div><p>{finishName(line.finish)}</p><div className="quantity-controls"><div className="quantity-stepper"><button onClick={() => cart.dispatch({ type: 'decrease', productId: line.productId, finish: line.finish })} disabled={line.quantity === 1} aria-label={`Decrease ${products[line.productId].name} ${finishName(line.finish)} quantity`}>−</button><span aria-label={`Quantity ${line.quantity}`}>{line.quantity}</span><button onClick={() => cart.dispatch({ type: 'increase', productId: line.productId, finish: line.finish })} disabled={line.quantity === MAX_QUANTITY} aria-label={`Increase ${products[line.productId].name} ${finishName(line.finish)} quantity`}>+</button></div><button className="text-button remove-item" data-remove={variantKey(line.productId, line.finish)} onClick={() => removeLine(line.productId, line.finish)} aria-label={`Remove ${products[line.productId].name} in ${finishName(line.finish)}`}>Remove</button></div>{line.quantity === MAX_QUANTITY && <p className="quantity-limit">Maximum {MAX_QUANTITY} per finish.</p>}</div>
        </li>)}</ul><div className="cart-summary"><div className="subtotal"><span>Subtotal</span><strong>{money(cart.total)}</strong></div><p>Fictional products and prices.<br />This portfolio concept does not take orders or payments.</p><button className="button button--wide" onClick={closeBag}>Continue exploring <span aria-hidden="true">↗</span></button></div></> : <div className="empty-bag"><span className="empty-bag__mark" aria-hidden="true">s</span><h3>A little room<br />for listening.</h3><p>Your bag is empty.</p><button className="button button--wide empty-bag__action" onClick={() => { if (product) closeBag(); else navigate('/products/arc?finish=pearl'); }}>Explore {item.name} <span aria-hidden="true">↗</span></button><p className="secondary-note">Fictional products. No payments.</p></div>}
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
