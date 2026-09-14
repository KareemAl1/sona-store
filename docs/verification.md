# Sona milestone one — verification

Verified locally on September 14, 2026. Implementation scope: homepage → Arc in Pearl, Graphite, and Fig → persistent bag. The fixed local preview is **http://127.0.0.1:4173/**.

## Final results

| Check | Actual result |
| --- | --- |
| TypeScript and production build | `npm run build` passed. 28 modules; application JS 276.51 kB / 87.85 kB gzip; CSS 14.15 kB / 3.84 kB gzip. |
| Cart unit tests | `npm test`: 11 passed. |
| Browser suite | `npm run test:e2e`: 27 passed in 33.2 seconds; one duplicate mobile responsive-matrix run intentionally skipped. No failed tests. |
| Automated accessibility | Zero axe violations for the tested WCAG 2 A/AA and 2.1 AA rules on homepage, Fig product, and populated bag in both desktop and mobile projects. |
| Runtime audit | No page errors, failed requests, or external requests in the observed homepage → Fig → bag journey. Fonts loaded; native modal active; focus on Close; body scroll locked. |
| Asset reproducibility | All seven served WebPs match fresh encodes of the retained originals byte for byte. Square dimensions and original hashes verified. Live studio geometry matches the retained evidence for all three finishes. |
| Local identity | Author and committer verified as **KareemAl1** before local milestone commits. No Git remote, push, or publishing. |

Environment: Windows, Node.js 22.12.0, npm 10.9.0, Microsoft Edge 153.0.4234.32 via Playwright 1.63.0. Desktop viewport 1440×1000; mobile emulation 390×844 with touch enabled. Additional responsive checks at 320, 640, 768, and 1440 pixels; a 200% root-text-size check at 640×900. Enlarged text is explicitly a text-size test, not browser-chrome zoom automation.

## Behaviors exercised

- Enter the product from the homepage, choose all three finishes, add two Fig units and one Pearl unit, increase/decrease quantity, remove a variant, restore the remaining quantity and subtotal after reload, remove the last item, and preserve the empty bag after another reload.
- Use keyboard Enter for navigation and Add; use native radio arrow keys; traverse the modal forward and backward with Tab; close with Escape; restore focus to the opener. Removing the last item provides a focused Explore Arc action.
- Use browser Back/Forward to restore finishes and bag visibility. Close a directly opened or reloaded bag without navigating away. Navigate from a homepage empty bag to Arc and focus its heading. Restore the homepage's scroll position through browser path history.
- Select Fig → Pearl and immediately Add within one browser task, then select Graphite and immediately Add. The actual chosen variants, confirmations, and $498 subtotal remain correct.
- Abort Fig image requests: the unavailable-preview notice appears and Fig can still be added.
- Throw on the storage getter, read, or write: the cart remains usable in memory and explains persistence limitations. Recover invalid saved lines and an unknown URL finish; ignore untrusted stored prices.
- Enable reduced motion before entry and change that preference while the page is open. Complete the shopping path and verify no running animations with the preference enabled.
- At narrow/tablet widths and enlarged text, finish selection and Add remain reachable, cart controls remain visible, and no horizontal document overflow occurs.

## Visual review and refinements

Actual browser screenshots were inspected, rather than judging only the concept or source code. The review covered desktop homepage/product, mobile homepage/product, populated/empty bags, 320px phone, 640px wide-mobile, 768px tablet, and enlarged text.

The original portrait renders cropped the headband in wide UI frames. The same original geometry was rerendered with a square camera aspect, preserving the locked camera position, target, vertical field of view, lighting, and finish alignment. The mobile gallery now grows with its width so intermediate screen sizes retain the silhouette. The detail image's intrinsic height was corrected to respect its responsive crop. Typography, pearl/plum contrast, section spacing, named finish swatches, and shopping controls were checked in the resulting captures.

Browser testing also exposed and resolved native-dialog Tab escape, a storage-read warning being dismissed by a successful write, delayed URL-controlled radio updates, empty-bag route focus, and StrictMode scroll-lock cleanup. Regression tests cover these behaviors.

Full-page images are used for the homepage and product. Bag images capture the actual viewport, avoiding misleading full-page stitching of a fixed native dialog. All screenshots are in `docs/screenshots/`.

## Original asset evidence

The retained Three.js source, GLB, original procedural textile maps, source PNGs, square/portrait verification records, and WebP exporter are under `assets/arc/`. Each finish uses the same assembly: 30 meshes and 101,760 triangles, with identical bounds. Only materials change. The square outputs are 1100×1100 at 256 samples; the material detail uses 384 samples. No generated product photographs, third-party meshes, or external texture images are shipped.

The portable studio was smoke-tested in the installed browser without changing the model: the scene loaded, all finish geometry matched `geometry-verification.json`, and no page errors occurred. Normal asset/dependency requests returned 200; traversal attempts returned 403 and malformed encoding returned 400. The temporary studio was stopped afterward. `assets/arc/README.md` documents rendering and export commands; `docs/studio-audit.json` records this check.

Instrument Serif and Manrope are self-hosted with their SIL Open Font License notices. The optional read-only `get_sona_bag` browser integration was unavailable in the tested Edge build (`document.modelContext` absent); the ordinary interface was verified without it. Native execution of that optional integration is not claimed.

## Limits and next scope

These results cover the installed Edge browser and mobile emulation, not physical iOS/Safari devices or a full human screen-reader audit. Automated axe checks do not establish complete accessibility conformance. Persistence is local to this browser origin; blocked storage intentionally falls back to the current visit.

Dot, Room, comparison, backend services, and checkout remain outside this approved first milestone. Products and prices are fictional. The interface makes no review, customer-count, delivery, battery-life, or audio-performance claims. Nothing has been published.
