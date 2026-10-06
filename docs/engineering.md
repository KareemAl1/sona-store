# Engineering decisions

## Scope and architecture

React + TypeScript + Vite, with React Router in declarative mode. The collection now covers homepage → Arc/Dot/Room → comparison or bag. A typed catalog supplies one shared product page, prices and comparison attributes; pages are not copied per product. There is no backend, checkout, payment form, or simulated order success.

CSS carries the typography, spacing, image transitions, and responsive behavior. There is no animation framework, live 3D runtime, or state-management library in the storefront bundle. Three.js and the path tracer are development dependencies used to generate the original product imagery offline.

## URL and history contract

- `/` is the homepage, `/#collection` its editorial collection, and `/products/arc|dot|room?finish=pearl|graphite|fig` selects a product and finish. Unknown product paths have an explicit recovery screen.
- `/compare` starts with all three products. `items=arc,dot` selects a subset; `items=` deliberately means zero. Unknown or duplicate IDs are filtered. Each native checkbox updates history; Back/Forward and reload restore the selection. The semantic comparison table keeps row labels visible and scrolls horizontally on narrow screens, including by keyboard.
- Missing/invalid finish values safely resolve to Pearl. Unrelated search parameters are preserved.
- Choosing a finish pushes one history entry. Browser Back/Forward restores prior finish selections.
- `cart=open` opens the bag as a modal over the current route. In-app entries get a tab-local history-key guard. Closing those entries goes Back; a direct or reloaded bag URL closes by replacing only its `cart` parameter. This prevents Close from unexpectedly leaving the product.
- The native dialog makes the underlying page inert. Escape, backdrop click, and Close use the same history-aware dismissal. Backdrop dismissal requires both the initial press and click to be outside the drawer, so dragging from cart content does not accidentally close it. The opener regains focus only if the shopper remains on the same page; otherwise the new route heading receives focus.
- Path changes update the document title, focus, and scroll. Finish and bag query changes do not reset scroll. Explicit collection links target the collection; history restores the visited position instead. Cart URLs preserve the anchor. Scroll positions are recorded while the route is visible, because reading scrollY during effect cleanup can capture a value already clamped by a shorter destination page. Browser Back restores saved page positions.

React Router's deferred UI transitions are disabled so its URL-controlled radio group updates during the selection event. The separate image transitions remain cosmetic. Add-to-bag also reads the current URL at activation, so a just-selected finish is honored even during a rapid interaction. No state mutation waits for an animation or image load.

## Persistence and money

The versioned `sona.cart.v1` local-storage record contains only product ID, finish ID, and integer quantity. A variant is identified by both product and finish: two Dot/Fig additions merge, while Arc/Fig and Dot/Fig stay separate. Product names and prices come from the typed catalog; stored prices are ignored. All arithmetic uses integer cents. The original schema already included product IDs, so existing Arc bags remain compatible without a migration or unnecessary version bump.

Restoration validates the top-level version and every line. Unknown products/finishes, invalid quantities, malformed JSON, and unsupported versions recover safely; duplicate variants merge and quantities cap at 99. There is a clear recovery notice.

The lazy initializer reads saved data before the first cart render. The save effect runs only after a user mutation, so an initial empty state cannot overwrite the saved bag. Accessing `localStorage`, reading it, and writing it are each allowed to fail. The cart continues in memory, and the UI explains that it may reset after reload. A successful write after a failed read does not dismiss that warning: it cannot establish that restoration will work on reload. Storage failure never disables shopping controls or creates a retry loop. Empty bags persist too.

## Original imagery

Each product has one authored mesh assembly. The geometry, camera, light positions, environment, and output dimensions are held constant across that product's finishes; only material colors vary. Arc source lives in `assets/arc`, Dot and Room in `assets/collection`. All use the established plum studio, deterministic textile texture and related satin/metal materials. No downloaded photographs, stock meshes, external textures, or third-party product logos are shipped. Dot's dedicated macro exposes its trim, silicone tip and molded cradle; Room's reveals woven construction and the top control. Original PNGs, editable JavaScript, Pearl GLBs, camera/geometry hashes and capture sample records are retained.

Responsive square WebP exports (1100px and 550px) serve the storefront; geometry and path tracing are not downloaded by shoppers. The refined assembly adds a fabric-covered underside pad, cushion seams, and contrasting textile, satin shell, and metal materials. Original procedural weave maps provide color, height, normal, and roughness detail. A source verifier compares geometry fingerprints and projected bounds across every finish, alongside camera parameters and asset hashes.

The square hero camera remains locked. Mobile gallery height scales with its width to preserve the full silhouette between phone and tablet sizes. A purpose-made 1400×1000 macro looks into the cushion from another angle, revealing the sewn rim and inner fabric. It exports proportionally at 1100×786 and displays without an additional CSS crop. The original portrait assets are retained as historical source material; the current hero and macro exports are identified in `assets/arc/README.md`. Instrument Serif and Manrope are self-hosted with their SIL Open Font License notices in `public/fonts`.

## Motion and responsiveness

- Opening: the title settles over 820ms (620ms on mobile), while the gallery caption settles over 780ms (620ms mobile). After the Pearl image has decoded, it settles 16px/1.065 scale in 860ms; mobile uses 10px/1.035 scale in 640ms. The image entrance runs once per app visit. All copy and shopping controls are visible immediately, and slow image loading cannot consume the product reveal before the image appears.
- Product entry: a decoded image reframes at 1.045 scale in 520ms; mobile uses a 6px/320ms destination reveal with opacity starting at .82. Movement is clipped to the gallery. Purchase controls appear immediately. The gallery remounts when the product ID changes, so a delayed Dot render can never leave Arc shown as Dot. A later decoded image triggers its pending entry, while changing reduced-motion preferences cannot replay a completed transition.
- Editorial reveals: `useEditorialMotion` observes the collection and material story once per element/route. Reveals start at visible opacity and travel 18px over 660ms, or 10px over 440ms on mobile. Focus cancels motion around the focused element, and cleanup cancels every active Web Animation. Finish/cart query updates do not replay route reveals.
- Reading progress: a decorative 4px line reflects native document scrolling through one scheduled animation frame; scrolling never updates React state. It disappears with reduced motion. Button arrows, finish swatches, collection imagery and the bag count provide brief input feedback without delaying mutations.
- Comparison selection: a 180ms opacity settle marks the updated table; checkbox and URL state change immediately. No scroll interception or input lock is used.
- Finish selection: decoded, aligned image layers blend in 190ms (160ms mobile). Interrupted selections blend toward the latest choice without a queue.
- Cart: data updates immediately; a 260ms drawer entrance becomes 200ms on mobile. The drawer remains opaque throughout so underlying imagery cannot compete with labels. Close never waits for an exit animation. Quantity controls work during entry.
- Reduced motion removes transforms, fades, and drawer motion, including when the preference changes while the page is open.

Normal scrolling remains native. Mobile has an early, sticky purchase summary with the current finish and price. The modal has its own native overflow and a sticky close control; body scroll locking is restored consistently. No scroll-jacking, pinned narrative sequence, autoplay audio, looping effects, or animation overlays intercept input.

If a selected image is delayed or unavailable, the prior decoded finish remains visible with an explicit label such as “Showing Pearl.” The selected radio and cart action still refer to the newly chosen finish. If no prior image exists, the gallery shows a preview status. Images reserve dimensions to avoid loading shifts.

## Color and composition

A saturated fig opening and deep-plum material section frame the original product renders. Warm chartreuse marks shopping actions and editorial accents; a rose collection surface keeps the middle of the page light. Large serif product indices extend the original asymmetric collection layout. The existing Instrument Serif/Manrope typography, square imagery, semantic controls and commerce state remain unchanged.

Static contrast calculations for the new main text pairs range from 5.38:1 (secondary text on the rose collection) to 13.28:1 (cart heading on plum); the primary action label is 12.14:1. These calculations complement browser review rather than replace it.

## Readability and layout

Navigation, finish labels, and primary shopping controls use 16px text at the default root size; product body text uses 18px. The homepage's shorter phone description uses 17px. A 560px desktop cart gives thumbnails and controls room to breathe. Quantity buttons have 48px targets, visible separators, and 18px tabular numerals. The phone cart fills the viewport.

The mobile opening brings the product forward by shortening the introduction and placing the concept price beside the entry action when space permits. Headers, purchase summaries, and shopping actions wrap under enlarged text instead of clipping. Finish labels remain named radio inputs with an explicit checked treatment. Tests cover 200% root text at both 390px and 640px widths.

## Accessibility and test strategy

Native links, buttons, radio inputs, and dialog semantics provide keyboard behavior. An explicit Tab wrap supplements the native modal because browser testing showed Tab could otherwise reach browser chrome. Finishes have names and checked indicators. Route headings receive focus; cart changes are announced. Quantity limits, empty states, failed storage, and removal focus are explicit. Mobile scroll padding leaves clearance for the sticky purchase summary.

Unit tests focus on malformed storage and business boundaries. Browser tests exercise the real interface, URL history, native dialog, reload restoration, reduced motion, and actual screenshots. Automated axe checks supplement visual and keyboard inspection; they are not a claim of exhaustive accessibility certification.

## Optional browser integration

If a browser exposes `document.modelContext`, a feature-detected `get_sona_bag` tool reads the same in-memory cart used by the UI. It validates an empty-object argument, has no mutations or network calls, and is removed on unmount. Unsupported or failing registration has no effect on shopping. This enhancement is outside the milestone's core interaction contract; native availability is recorded in the verification report.
