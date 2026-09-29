import { useState } from 'react';
import type { RefObject } from 'react';
import { Link, useSearchParams } from 'react-router';
import { comparisonIds, money, productIds, productImage, products, productUrl } from './catalog';
import type { ProductId } from './catalog';

function CollectionImage({ id }: { id: ProductId }) {
  const [failed, setFailed] = useState(false);
  return <div className="collection-image">{failed
    ? <p role="img" aria-label={`${products[id].name} preview unavailable`}>Preview unavailable.<br />You can still explore {products[id].name}.</p>
    : <img src={productImage(id, 'pearl')} srcSet={`${productImage(id, 'pearl', 'small')} 550w, ${productImage(id, 'pearl')} 1100w`} sizes="(max-width: 700px) 100vw, 50vw" width="1100" height="1100" loading="lazy" alt={`Sona ${products[id].name} in Pearl, in the plum studio`} onError={() => setFailed(true)} />}</div>;
}

export function Collection() {
  return <section className="collection" id="collection" aria-labelledby="collection-heading" tabIndex={-1}>
    <div className="collection-heading"><div><p className="eyebrow">01 / 02 / 03</p><h2 id="collection-heading">Three forms.<br />One point of view.</h2></div><div className="collection-intro"><p>Over-ear, in-ear, and at home. Find a form for your everyday.</p><nav aria-label="Explore the collection">{productIds.map(id => <Link key={id} to={productUrl(id)}>{products[id].name} ↗</Link>)}</nav></div></div>
    <div className="collection-spread">{(['dot', 'room'] as const).map(id => {
      const item = products[id];
      return <article key={id} className={`collection-piece collection-piece--${id}`}>
        <Link className="collection-image-link" to={productUrl(id)} aria-label={`Explore ${item.name}`}><CollectionImage id={id} /></Link>
        <div className="collection-caption"><p className="eyebrow">{item.number} / {item.type}</p><div className="collection-name"><h3><Link to={productUrl(id)}>{item.name}</Link></h3><p>{money(item.price)}<span>Concept price</span></p></div><p className="collection-description">{item.introduction}</p><Link className="collection-action" to={productUrl(id)}>Discover {item.name} <span aria-hidden="true">↗</span></Link></div>
      </article>;
    })}</div>
    <div className="collection-compare"><p>Find your place in the collection.</p><Link to="/compare" className="button">Compare the three <span aria-hidden="true">↗</span></Link></div>
  </section>;
}

const comparisonRows = [
  { label: 'Form', key: 'form' },
  { label: 'Intended setting', key: 'setting' },
  { label: 'Portability', key: 'portability' },
] as const;

export function ComparisonPage({ headingRef }: { headingRef: RefObject<HTMLHeadingElement | null> }) {
  const [search, setSearch] = useSearchParams();
  const selected = comparisonIds(search.get('items'));
  function toggle(id: ProductId) {
    // Read the live URL so rapid activations never start from an outdated selection.
    const params = new URLSearchParams(window.location.search);
    const current = comparisonIds(params.get('items'));
    const next = current.includes(id) ? current.filter(value => value !== id) : [...current, id];
    params.set('items', productIds.filter(value => next.includes(value)).join(','));
    setSearch(params);
  }
  return <section className="comparison-page">
    <Link className="back-link" to="/#collection">← Back to the collection</Link>
    <div className="comparison-intro"><p className="eyebrow">Side by side</p><h1 ref={headingRef} tabIndex={-1}>Find your form.</h1><p>Compare the objects, their intended settings, and concept prices. All three are fictional design studies.</p></div>
    <fieldset className="comparison-picker"><legend>Choose up to three products</legend><div>{productIds.map(id => <label key={id}><input type="checkbox" checked={selected.includes(id)} onChange={() => toggle(id)} /><span>{products[id].name}</span></label>)}</div></fieldset>
    <p className="comparison-status" role="status">{selected.length ? `${selected.length} ${selected.length === 1 ? 'product' : 'products'} selected.` : 'Choose a product above to begin comparing.'}</p>
    {selected.length ? <><p className="comparison-scroll-hint">On smaller screens, scroll the table sideways to see each product.</p><div className="comparison-scroll" role="region" aria-label="Product comparison table, horizontally scrollable" tabIndex={0}>
      <table className="comparison-table" key={selected.join(',')} style={{ minWidth: `${160 + selected.length * 240}px` }}>
        <caption className="sr-only">Sona product forms, intended settings, portability, finishes, and concept prices</caption>
        <thead><tr><th scope="col"><span className="eyebrow">The collection</span></th>{selected.map(id => <th scope="col" key={id}><CollectionImage id={id} /><h2>{products[id].name}</h2></th>)}</tr></thead>
        <tbody>{comparisonRows.map(row => <tr key={row.key}><th scope="row">{row.label}</th>{selected.map(id => <td key={id}>{products[id][row.key]}</td>)}</tr>)}
          <tr><th scope="row">Finishes</th>{selected.map(id => <td key={id}>Pearl, Graphite, Fig</td>)}</tr>
          <tr><th scope="row">Concept price</th>{selected.map(id => <td key={id} className="comparison-price">{money(products[id].price)}</td>)}</tr>
          <tr><th scope="row"><span className="sr-only">Explore a product</span></th>{selected.map(id => <td key={id}><Link className="button" to={productUrl(id)}>Explore {products[id].name} <span aria-hidden="true">↗</span></Link></td>)}</tr>
        </tbody>
      </table>
    </div></> : <div className="comparison-empty"><h2>A little room to compare.</h2><p>Select Arc, Dot, or Room above to see their forms, finishes, and concept prices side by side.</p></div>}
  </section>;
}
