# Engineering decisions

## Scope and architecture

React + TypeScript + Vite, with React Router in declarative mode. The initial scope is intentionally one polished shopping journey: homepage → Arc → bag. Dot, Room, and comparison remain outside this milestone. There is no backend, checkout, payment form, or simulated order success.

CSS carries the typography, spacing, image transitions, and responsive behavior. There is no animation framework, live 3D runtime, or state-management library in the storefront bundle. Three.js and the path tracer are development dependencies used to generate the original product imagery offline.

## URL and history contract

- `/` is the homepage; `/products/arc?finish=pearl|graphite|fig` is the product page.
- Missing/invalid finish values safely resolve to Pearl. Unrelated search parameters are preserved.
- Choosing a finish pushes one history entry. Browser Back/Forward restores prior finish selections.
- `cart=open` opens the bag as a modal over the current route. In-app entries get a tab-local history-key guard. Closing those entries goes Back; a direct or reloaded bag URL closes by replacing only its `cart` parameter. This prevents Close from unexpectedly leaving the product.
- The native dialog makes the underlying page inert. Escape, backdrop click, and Close use the same history-aware dismissal. The opener regains focus only if the shopper remains on the same page; otherwise the new route heading receives focus.
- Path changes update the document title, focus, and scroll. Finish and bag query changes do not reset scroll. Browser Back restores saved page positions.

React Router's deferred UI transitions are disabled so its URL-controlled radio group updates during the selection event. The separate image transitions remain cosmetic. Add-to-bag also reads the current URL at activation, so a just-selected finish is honored even during a rapid interaction. No state mutation waits for an animation or image load.

## Persistence and money

The versioned `sona.cart.v1` local-storage record contains only product ID, finish ID, and integer quantity. Product names and prices come from the typed catalog; stored prices are ignored. All arithmetic uses integer cents.

Restoration validates the top-level version and every line. Unknown products/finishes, invalid quantities, malformed JSON, and unsupported versions recover safely; duplicate variants merge and quantities cap at 99. There is a clear recovery notice.

The lazy initializer reads saved data before the first cart render. The save effect runs only after a user mutation, so an initial empty state cannot overwrite the saved bag. Accessing `localStorage`, reading it, and writing it are each allowed to fail. The cart continues in memory, and the UI explains that it may reset after reload. A successful write after a failed read does not dismiss that warning: it cannot establish that restoration will work on reload. Storage failure never disables shopping controls or creates a retry loop. Empty bags persist too.

## Original imagery

One authored mesh assembly defines Arc. The geometry, camera, light positions, environment, and output dimensions are held constant for all finishes; only material colors vary. The source and GLB are kept in `assets/arc`. No generated product photographs, stock meshes, external textures, or third-party logos are shipped. The procedural textile texture is original and deterministic.

Responsive square WebP exports (1100px and 550px) serve the storefront; geometry and path tracing are not downloaded by shoppers. The original portrait framing cropped the headband in a wide viewport, so the same scene was rendered with a square camera aspect. Camera position, target, vertical field of view, geometry, and lighting remain fixed between all three square finish renders. Mobile gallery height scales with its width to preserve the full silhouette between phone and tablet sizes. The material detail is rendered from the same model with a closer camera. Instrument Serif and Manrope are self-hosted with their SIL Open Font License notices in `public/fonts`.

## Motion and responsiveness

- Opening: already-visible product settles 12px/1.02 scale in 480ms; mobile uses 6px/300ms. It runs once per app visit.
- Homepage to product: matching image reframes in 320ms; mobile uses a 180ms fade. Purchase controls appear immediately.
- Finish selection: preloaded aligned image layers blend in 160ms (140ms mobile). Interrupted selections blend toward the latest choice.
- Cart: data updates immediately; a 220ms drawer entrance becomes 180ms on mobile. Close never waits for an exit animation.
- Reduced motion removes transforms, fades, and drawer motion, including when the preference changes while the page is open.

Normal scrolling remains native. Mobile has an early, sticky purchase summary with the current finish and price. The modal has its own native overflow and a sticky close control; body scroll locking is restored consistently. No scroll-jacking, pinned narrative sequence, autoplay audio, looping effects, or animation overlays intercept input.

If a selected image is delayed or unavailable, a clearly labeled preview status replaces it while finish selection and cart actions remain available. Images reserve dimensions to avoid loading shifts.

## Accessibility and test strategy

Native links, buttons, radio inputs, and dialog semantics provide keyboard behavior. An explicit Tab wrap supplements the native modal because browser testing showed Tab could otherwise reach browser chrome. Finishes have names and checked indicators. Route headings receive focus; cart changes are announced. Quantity limits, empty states, failed storage, and removal focus are explicit. Mobile scroll padding leaves clearance for the sticky purchase summary.

Unit tests focus on malformed storage and business boundaries. Browser tests exercise the real interface, URL history, native dialog, reload restoration, reduced motion, and actual screenshots. Automated axe checks supplement visual and keyboard inspection; they are not a claim of exhaustive accessibility certification.

## Optional browser integration

If a browser exposes `document.modelContext`, a feature-detected `get_sona_bag` tool reads the same in-memory cart used by the UI. It validates an empty-object argument, has no mutations or network calls, and is removed on unmount. Unsupported or failing registration has no effect on shopping. This enhancement is outside the milestone's core interaction contract; native availability is recorded in the verification report.
