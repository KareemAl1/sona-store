# Engineering decisions

## Scope and architecture

React + TypeScript + Vite, with React Router in declarative mode. The initial scope is intentionally one polished shopping journey: homepage → Arc → bag. Dot, Room, and comparison remain outside this milestone. There is no backend, checkout, payment form, or simulated order success.

CSS carries the typography, spacing, image transitions, and responsive behavior. There is no animation framework, live 3D runtime, or state-management library in the storefront bundle. Three.js and the path tracer are development dependencies used to generate the original product imagery offline.

## URL and history contract

- `/` is the homepage; `/products/arc?finish=pearl|graphite|fig` is the product page.
- Missing/invalid finish values safely resolve to Pearl. Unrelated search parameters are preserved.
- Choosing a finish pushes one history entry. Browser Back/Forward restores prior finish selections.
- `cart=open` opens the bag as a modal over the current route. In-app entries get a tab-local history-key guard. Closing those entries goes Back; a direct or reloaded bag URL closes by replacing only its `cart` parameter. This prevents Close from unexpectedly leaving the product.
- The native dialog makes the underlying page inert. Escape, backdrop click, and Close use the same history-aware dismissal. Backdrop dismissal requires both the initial press and click to be outside the drawer, so dragging from cart content does not accidentally close it. The opener regains focus only if the shopper remains on the same page; otherwise the new route heading receives focus.
- Path changes update the document title, focus, and scroll. Finish and bag query changes do not reset scroll. Browser Back restores saved page positions.

React Router's deferred UI transitions are disabled so its URL-controlled radio group updates during the selection event. The separate image transitions remain cosmetic. Add-to-bag also reads the current URL at activation, so a just-selected finish is honored even during a rapid interaction. No state mutation waits for an animation or image load.

## Persistence and money

The versioned `sona.cart.v1` local-storage record contains only product ID, finish ID, and integer quantity. Product names and prices come from the typed catalog; stored prices are ignored. All arithmetic uses integer cents.

Restoration validates the top-level version and every line. Unknown products/finishes, invalid quantities, malformed JSON, and unsupported versions recover safely; duplicate variants merge and quantities cap at 99. There is a clear recovery notice.

The lazy initializer reads saved data before the first cart render. The save effect runs only after a user mutation, so an initial empty state cannot overwrite the saved bag. Accessing `localStorage`, reading it, and writing it are each allowed to fail. The cart continues in memory, and the UI explains that it may reset after reload. A successful write after a failed read does not dismiss that warning: it cannot establish that restoration will work on reload. Storage failure never disables shopping controls or creates a retry loop. Empty bags persist too.

## Original imagery

One authored mesh assembly defines Arc. The geometry, camera, light positions, environment, and output dimensions are held constant for all finishes; only material colors vary. The source and GLB are kept in `assets/arc`. No generated product photographs, stock meshes, external textures, or third-party logos are shipped. The procedural textile texture is original and deterministic.

Responsive square WebP exports (1100px and 550px) serve the storefront; geometry and path tracing are not downloaded by shoppers. The refined assembly adds a fabric-covered underside pad, cushion seams, and contrasting textile, satin shell, and metal materials. Original procedural weave maps provide color, height, normal, and roughness detail. A source verifier compares geometry fingerprints and projected bounds across every finish, alongside camera parameters and asset hashes.

The square hero camera remains locked. Mobile gallery height scales with its width to preserve the full silhouette between phone and tablet sizes. A purpose-made 1400×1000 macro looks into the cushion from another angle, revealing the sewn rim and inner fabric. It exports proportionally at 1100×786 and displays without an additional CSS crop. The original portrait assets are retained as historical source material; the current hero and macro exports are identified in `assets/arc/README.md`. Instrument Serif and Manrope are self-hosted with their SIL Open Font License notices in `public/fonts`.

## Motion and responsiveness

- Opening: after the Pearl image has decoded, it settles 10px/1.025 scale in 520ms; mobile uses 6px/1.015 scale in 360ms. It runs once per app visit. Slow image loading cannot consume the reveal before the image appears.
- Homepage to product: the matching image reframes at 1.035 scale in 340ms; mobile uses a 6px/220ms destination reveal with opacity starting at .82. Movement is clipped to the gallery. Purchase controls appear immediately.
- Finish selection: decoded, aligned image layers blend in 190ms (160ms mobile). Interrupted selections blend toward the latest choice without a queue.
- Cart: data updates immediately; a 260ms drawer entrance becomes 200ms on mobile. The drawer remains opaque throughout so underlying imagery cannot compete with labels. Close never waits for an exit animation. Quantity controls work during entry.
- Reduced motion removes transforms, fades, and drawer motion, including when the preference changes while the page is open.

Normal scrolling remains native. Mobile has an early, sticky purchase summary with the current finish and price. The modal has its own native overflow and a sticky close control; body scroll locking is restored consistently. No scroll-jacking, pinned narrative sequence, autoplay audio, looping effects, or animation overlays intercept input.

If a selected image is delayed or unavailable, the prior decoded finish remains visible with an explicit label such as “Showing Pearl.” The selected radio and cart action still refer to the newly chosen finish. If no prior image exists, the gallery shows a preview status. Images reserve dimensions to avoid loading shifts.

## Readability and layout

Navigation, finish labels, and primary shopping controls use 16px text at the default root size; product body text uses 18px. The homepage's shorter phone description uses 17px. A 560px desktop cart gives thumbnails and controls room to breathe. Quantity buttons have 48px targets, visible separators, and 18px tabular numerals. The phone cart fills the viewport.

The mobile opening brings the product forward by shortening the introduction and placing the concept price beside the entry action when space permits. Headers, purchase summaries, and shopping actions wrap under enlarged text instead of clipping. Finish labels remain named radio inputs with an explicit checked treatment. Tests cover 200% root text at both 390px and 640px widths.

## Accessibility and test strategy

Native links, buttons, radio inputs, and dialog semantics provide keyboard behavior. An explicit Tab wrap supplements the native modal because browser testing showed Tab could otherwise reach browser chrome. Finishes have names and checked indicators. Route headings receive focus; cart changes are announced. Quantity limits, empty states, failed storage, and removal focus are explicit. Mobile scroll padding leaves clearance for the sticky purchase summary.

Unit tests focus on malformed storage and business boundaries. Browser tests exercise the real interface, URL history, native dialog, reload restoration, reduced motion, and actual screenshots. Automated axe checks supplement visual and keyboard inspection; they are not a claim of exhaustive accessibility certification.

## Optional browser integration

If a browser exposes `document.modelContext`, a feature-detected `get_sona_bag` tool reads the same in-memory cart used by the UI. It validates an empty-object argument, has no mutations or network calls, and is removed on unmount. Unsupported or failing registration has no effect on shopping. This enhancement is outside the milestone's core interaction contract; native availability is recorded in the verification report.
