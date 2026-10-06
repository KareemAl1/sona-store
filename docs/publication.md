# Sona — publication and verification

Sona was published on October 6, 2026: [live demo](https://sona-store.vercel.app) · [public repository](https://github.com/KareemAl1/sona-store). Vercel is linked to the repository's `main` branch in the `kareems-projects-bc520863` workspace.

Sona includes three fictional products, three finishes each, comparison and a mixed-product persistent bag. The September 29 collection review below remains dated historical evidence. That local milestone did not publish a repository or deployment; publication followed on October 6.

## October 6, 2026 color and motion pass

The second release adds a saturated fig opening, warm chartreuse shopping actions, a rose collection and a deep-plum material section/cart header. Larger serif product indices strengthen the asymmetric collection composition. Original renders, product data, finish/cart URL state and persistence logic are unchanged.

The title, decoded hero image and gallery caption have distinct entrances; controls remain visible and immediately usable. `useEditorialMotion.ts` owns short section reveals and native-scroll progress, uses one scheduled frame for progress, and never writes React state on scroll. Its observers and Web Animations clean up on route/preference changes; focus cancels motion around the active control. CSS supplies hover, swatch, count and caption feedback. The existing gallery still owns loading, aligned finish transitions and interrupted selections. [Motion timings and architecture](engineering.md) describe the implementation.

| Check | Actual result |
| --- | --- |
| Production build | TypeScript and Vite passed; 30 modules; JS 289.58 kB / 91.43 kB gzip, CSS 30.10 kB / 6.77 kB gzip |
| Unit tests | 18 passed on Node 22.12.0 / npm 10.9.0 |
| Focused local browser layout review | Hero, collection, product and cart inspected at 1280px desktop; at 390×844, the hero had no horizontal overflow and the product appeared within the first viewport |
| Rapid finish and bag journey | Dot Graphite → Fig followed immediately by Add recorded Fig; quantity two survived reload; decrement and removal reached the empty state |
| Keyboard dialog | Shift+Tab/Tab wrapped between Close and Continue exploring; Escape closed the bag |
| Static motion/contrast review | Reveals begin visible, cancel around focused elements and on preference/route cleanup; scrolling uses one scheduled frame. Checked main text/background pairs exceed 4.5:1 |

Hosted verification of [`892344d`](https://github.com/KareemAl1/sona-store/commit/892344d2b33b9024b3af14aacae292a655584400): its automatic Git-linked Vercel deployment reached Ready, the public homepage was checked at 1280×900 and 390×844 without horizontal overflow, the mobile Arc/Fig Add-to-bag and modal flow passed, and the updated captures below were taken from the live deployment.

Updated captures: [desktop](publication/screenshots/color-motion-desktop.jpg) · [phone viewport](publication/screenshots/color-motion-phone.jpg). The `live-desktop.jpg` and `live-phone.jpg` images below preserve the first release from earlier the same day.

These are focused browser checks, not a fresh full Playwright or axe run. The active browser could not change the system reduced-motion preference, so reduced-motion rules were statically reviewed and no new live preference-toggle result is claimed. No physical-phone, Safari, frame-rate or network-performance measurement was made.

## October 6, 2026 first publication checks

| Check | Result |
| --- | --- |
| Local production build | TypeScript and Vite passed; 29 modules; JavaScript 287.39 kB / 90.75 kB gzip, CSS 21.38 kB / 5.16 kB gzip |
| Cart model tests | 18 passed on Node 22.12.0 / npm 10.9.0 |
| Dependency audit | `npm audit --json`: zero reported vulnerabilities after `sharp` 0.35.4 → 0.35.5 and transitive `source-map-js` 1.2.1 → 1.2.2; build and all 18 unit tests passed again |
| Asset compatibility after the Sharp patch | Both export scripts passed `--check`; all 21 served WebPs reproduced byte-for-byte without changing assets |
| Repository audit | 225 tracked paths and six reachable commits reviewed before publication; no common secret markers, credential assignments or unrelated private files found |
| Hosting | Public Vercel deployment with Vite output from `dist/` and the configured SPA fallback |

The hosted browser smoke passed on [sona-store.vercel.app](https://sona-store.vercel.app): homepage → Discover Arc → Fig updated the URL and product render; Add produced $249, and increasing to two produced $498. Reload restored both the quantity and open bag; Escape closed the modal. Direct Dot/Graphite and Room/Pearl routes loaded. Adding one Dot to the two Arc items produced a $647 mixed bag; decrement and removal worked through the empty state. `/compare?items=dot,room` loaded the selected comparison table, and Back/Forward restored routes.

The hosted desktop homepage and the Room product page at a 390×844 phone viewport were inspected for layout and readability. Actual captures: [live desktop](publication/screenshots/live-desktop.jpg) · [live phone](publication/screenshots/live-phone.jpg).

The older screenshots remain the actual September 29 local browser captures; the two `live-*.jpg` captures document the October 6 first release before the color and motion update. The full browser regression suite was not rerun for publication. The hosted smoke did not repeat storage-denial testing or add a separate standalone Chrome pass, physical-device or Safari testing, frame-rate measurement, or repeatable network-performance measurement. The 18 unit tests cover cart validation and storage failure boundaries; the broader browser evidence below retains its original date.

## Implemented scope

- Arc remains the opening product; Dot and Room form an asymmetric editorial collection below it. Shared product pages keep typography, controls and motion consistent.
- Original Dot/Room geometry, six aligned finish renders and two dedicated material macros use the existing plum studio. Reproducible sources and sample/hash records live in `assets/collection`. Website exports total **500,866 bytes** for the 14 new WebPs; source geometry is never loaded by the storefront.
- Comparison uses native checkboxes and a semantic table, from zero to three products. Meaningful rows cover form, intended setting, portability, finishes and concept price. Selection lives in the URL.
- Cart identity includes product and finish. Exact variants merge, different variants remain separate, prices derive from the catalog, and the existing Arc storage schema restores unchanged.
- Product gallery state resets by product ID, preventing a previous product's photo from being mislabeled during loading. Finish changes and Add remain immediate while images decode or transitions run. Cart thumbnails preserve each complete square composition.
- The collection anchor and cart share history without resetting shopping controls or stealing the bag opener's focus.

## September 29, 2026 collection verification

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

## Deployment and local preview

The production output is `dist/`. `vercel.json` declares Vite, `npm run build`, and the SPA fallback needed for direct product and comparison routes. The Git-linked Vercel project deploys `main` to [sona-store.vercel.app](https://sona-store.vercel.app). No environment variables or service credentials are required. The September 29 production smoke above checked Vite's local built output; it is distinct from the October 6 hosted checks.

The local preview stays at **http://127.0.0.1:4173/**. From this repository, `npm run preview:start` restarts it after a reboot; `preview:status` checks it and `preview:stop` stops only its matched process. This is a development preview for local review. `.cache/`, dependencies, build output and browser reports remain ignored.

There is no ESLint setup in Sona; existing TypeScript/build checks were used instead of adding a dependency solely for a checklist. Fonts retain their OFL notices; original assets retain their provenance. Products, prices and use descriptions are fictional, with no audio/battery/manufacturing claims.

## Small future backlog

1. Test the finished journey on a physical phone and current Safari with keyboard/assistive-technology review.
2. Measure the hosted site under a repeatable mobile network/device profile before proposing performance changes.

Checkout, authentication, analytics and more products are outside this milestone.
