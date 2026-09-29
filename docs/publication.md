# Collection milestone — publication review

Local review recorded on 2026-09-29. Sona now has three fictional products, three finishes each, comparison and a mixed-product persistent bag. No remote repository, deployment or public profile edit was made. The existing Arc visual refinement is preserved; this milestone extends it.

## Implemented scope

- Arc remains the opening product; Dot and Room form an asymmetric editorial collection below it. Shared product pages keep typography, controls and motion consistent.
- Original Dot/Room geometry, six aligned finish renders and two dedicated material macros use the existing plum studio. Reproducible sources and sample/hash records live in `assets/collection`. Website exports total **500,866 bytes** for the 14 new WebPs; source geometry is never loaded by the storefront.
- Comparison uses native checkboxes and a semantic table, from zero to three products. Meaningful rows cover form, intended setting, portability, finishes and concept price. Selection lives in the URL.
- Cart identity includes product and finish. Exact variants merge, different variants remain separate, prices derive from the catalog, and the existing Arc storage schema restores unchanged.
- Product gallery state resets by product ID, preventing a previous product's photo from being mislabeled during loading. Finish changes and Add remain immediate while images decode or transitions run. Cart thumbnails preserve each complete square composition.
- The collection anchor and cart share history without resetting shopping controls or stealing the bag opener's focus.

## Actual verification

| Check | Result |
| --- | --- |
| TypeScript and Vite production build | Passed; no Sona chunk-size warning |
| Cart model tests | 18 passed |
| Full browser suite | 53 passed, 3 intentional skips in 58.3 seconds (56 cases; two duplicate responsive matrices and desktop-only backdrop omitted on mobile) |
| Production asset size | JavaScript 287.39 kB / 90.75 kB gzip; CSS 21.38 kB / 5.16 kB gzip (Vite report, not runtime performance) |
| Original collection source verification | Geometry/camera checks passed for all finishes |
| Asset export verification | All 14 WebPs reproduced byte-for-byte; frozen hashes and dimensions passed |
| Chrome screenshot pass | 1440×1000 desktop, 768×1024 tablet, 390×844 phone, 320×740 narrow phone; 100% page scale and expected CSS viewport width |
| Visual-pass console/network | No page exceptions, failed requests or HTTP errors on normal journeys |
| Production direct-route smoke | Passed on built assets: all three Graphite URLs, comparison subset reload, unknown route recovery, mixed bag reload ($747), reduced motion; zero errors |
| Durable preview | Loopback-only launcher verifies HTML, source module and all three product images |

The browser regression suite uses installed Edge 154.0.4258.37. The independent screenshot and production passes use installed Chrome 154.0.8037.58 on this Windows PC. Phone profiles emulate viewport/touch; they are not physical-device or Safari tests. Automated axe checks cover home, Arc, Dot, Room, comparison and cart states and supplement keyboard/focus testing; they are not accessibility certification.

Covered behavior includes merge/separation, quantity boundaries, removal focus and empty states; old/invalid storage and blocked access/read/write; reload restoration; product/finish/comparison/cart history and unknown routes; keyboard radio/checkbox/dialog behavior; delayed/failed images; rapid finish and cart input; live reduced-motion preferences; normal scroll restoration; 320/390/640/768 widths and enlarged root text. Comparison's horizontal region accepts keyboard scrolling without page overflow. Synthetic loading/storage failures are expected only in their dedicated tests.

The visual pass preserved **18px** product body text, **16px** navigation/finish labels, a **560px** desktop drawer and **48px** quantity buttons. At 390px the home image still starts at **399.66px**. These are CSS measurements at 100% scale, not a performance metric. Full-page captures scroll through lazy images before recording; a screenshot of an offscreen placeholder is not treated as an image-loading result.

[Before/after and final views](publication/compare.html) · [raw screenshot measurements](publication/collection-capture-results.json) · [production smoke](publication/production-results.json)

## Interview recap

1. **State:** the typed catalog owns product definitions/prices; URL parameters own the selected product finish, comparison subset and bag visibility. One cart reducer/provider owns the current lines. Transient image decoding and animation stay in the gallery.
2. **Persistence:** a lazy read validates a versioned product/finish/quantity record. Saves occur after user mutations, never an empty initial render. Exceptions leave an in-memory bag and an honest warning. Integer-cent totals avoid floating-point price arithmetic.
3. **Input and transitions:** handlers read the live URL for rapid selections. Loading and animation never gate Add, quantity or navigation. The gallery owns/cancels its animation and remounts per product; reduced motion removes cosmetic movement.
4. **Concrete tradeoff:** authored offline renders preserve exact finish alignment without shipping a 3D engine. A review also caught collection-anchor history overriding scroll/focus restoration; navigation and modal history are now distinguished and regression-tested.

## Publication handoff

The production output is `dist/`. `vercel.json` is local preparation only: it declares Vite and the SPA fallback needed for deep product routes, following [Vercel's Vite documentation](https://vercel.com/docs/frameworks/frontend/vite). The production smoke verifies Vite's local built output; no hosted routing, HTTPS headers or deployed domain has been tested. Review the repository and hosting destination before authorizing publication. No account linkage is embedded.

The local preview stays at **http://127.0.0.1:4173/**. From this repository, `npm run preview:start` restarts it after a reboot; `preview:status` checks it and `preview:stop` stops only its matched process. This is a development preview for local review. `.cache/`, dependencies, build output and browser reports remain ignored.

There is no ESLint setup in Sona; existing TypeScript/build checks were used instead of adding a dependency solely for a checklist. Fonts retain their OFL notices; original assets retain their provenance. Products, prices and use descriptions are fictional, with no audio/battery/manufacturing claims.

## Small future backlog

1. After approval, publish and verify real hosted deep links, HTTPS behavior and public profile URLs.
2. Test the finished journey on a physical phone and current Safari with keyboard/assistive-technology review.
3. Measure the hosted site under a repeatable mobile network/device profile before proposing performance changes.

Checkout, authentication, analytics and more products are outside this milestone.
