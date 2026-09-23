# Sona visual refinement — verified September 23, 2026

Scope: refine the existing homepage → Arc in Pearl, Graphite, and Fig → persistent bag. No products, checkout, backend, external services, or publishing were added.

## What changed

The plum-and-pearl palette and Instrument Serif headings remain. Body copy, navigation, named finishes, and shopping controls are larger. The desktop bag is wider, with larger thumbnails, 48px quantity targets, and clearer numeric values. Phone introduction copy and spacing bring the complete product into the opening viewport. Headers and shopping actions wrap at enlarged text sizes.

Original geometry now includes a padded headband underside, cushion seams, and richer procedural weave. Satin shells, woven cushions, and metal hardware have distinct surface treatments. The macro is a separate view into the cushion, showing its inner fabric and sewn edge; it is no longer a repeated hero crop. All finish geometry, transforms, hero camera parameters, and projected bounds match exactly.

The opening waits for decoded imagery. A delayed finish retains the previous image with an explicit label, while selection and Add respond immediately. Cart input remains live during entry; the drawer stays opaque throughout. Dragging from cart content to the backdrop no longer dismisses it. Reduced-motion changes cancel ongoing animation, and toggling the preference cannot replay a completed route transition.

## Measured before and after

These are actual browser measurements at 100% scale, not estimates from a design board. See [the comparison gallery](refinement/compare.html), [before measurements](refinement/before-measurements.json), and [after measurements](refinement/after-measurements.json).

| Measurement | Before | After |
| --- | --- | --- |
| Desktop main copy | 16px | 18px |
| Phone homepage copy | 16px | 17px |
| Navigation | 14px | 16px |
| Desktop finish labels | 14px | 16px |
| Phone finish labels | 13px | 16px |
| Desktop cart width | 460px | 560px |
| Desktop quantity button width | 40px | 48px |
| Phone quantity button width | 37px | 48px |
| Quantity value text | 14px | 18px |
| Phone homepage gallery top | 490.64px | 399.66px |

The phone gallery begins about 91px sooner while preserving the two-line serif headline. Measurements use desktop 1440×1000 and phone 390×844; both report visual viewport scale 1, device scale factor 1, and the expected inner width. The gallery displays screenshots proportionally and links to original files.

## Actual verification results

| Check | Result |
| --- | --- |
| Production build | Passed after the final cart refinement: 28 modules; JS 277.31 kB / 88.11 kB gzip; CSS 15.16 kB / 4.04 kB gzip. |
| Cart unit tests | `npm test`: 11 passed. |
| Full browser suite | `npm run test:e2e`: 36 passed, 2 intentionally skipped, 42.3 seconds. |
| Final motion follow-up | After removing cart transparency, `tests/motion.spec.ts`: 9 passed, 1 intentional mobile backdrop skip, 7.4 seconds. Final animation frames were recaptured and inspected. |
| Automated accessibility | Zero axe violations for tested WCAG 2 A/AA and 2.1 AA rules on home, Fig product, and populated bag in both profiles. |
| Capture runtime | No page errors in either final Chrome screenshot journey or motion review. |
| Asset source/export verification | Integrated `node assets/arc/verify-refinement.cjs --check` passed. Seven served WebPs match fresh exports byte for byte. |
| Preview | Local-only Vite at `http://127.0.0.1:4173/`; no external hosting. |

The two full-suite skips avoid a duplicate responsive matrix and a phone backdrop test because the phone drawer fills the viewport. Tests use installed Microsoft Edge through Playwright 1.63.0. Final screenshot and motion captures use installed Chrome 153.0.8010.54. Windows, Node 22.12.0, npm 10.9.0.

The browser checks exercise:

- All finishes, Add, quantity increase/decrease, removal, empty state, restored quantities/subtotal after reload, and persistence of the empty bag.
- Keyboard links/buttons, arrow-key radio selection, forward/backward modal Tab wrapping, Escape, opener focus, and removal focus.
- Browser Back/Forward through finish and cart states, directly opened/reloaded cart URLs, route heading focus, and scroll restoration.
- Storage getter/read/write failures, invalid stored data, unknown finishes, and untrusted stored prices.
- Rapid finish changes including a return to the original finish; Add in the same browser task; repeated close/reopen; quantity changes during a running drawer animation.
- Delayed opening imagery, delayed finish imagery with a correctly labeled prior view, failed image requests, and shopping during those states.
- Reduced motion at entry and while animations are running; no unexpected route replay when the preference is turned off.
- Responsive widths 320, 640, 768, and 1440; 200% root text at 390 and 640. No horizontal document/cart overflow, and shopping controls remain reachable.

The 200% check changes root text size; it does not claim to automate browser chrome zoom. Normal before/after captures are at 100% scale.

## Visual and motion review

Actual desktop/phone homepage, full product page, populated bag, and enlarged phone-text screenshots were inspected. Full-product captures show the dedicated macro at its natural aspect ratio. The regular suite also retains empty-bag and intermediate-width screenshots under `docs/screenshots`.

The four motion moments were sampled in the real Chrome page at 0%, 50%, and 100% of their animation timelines. Those animation frames were paused for inspection; this is not a frame-rate benchmark. Timing/easing records and captures are under [refinement/motion](refinement/motion/review.json). Both layers of finish crossfades were sampled together. Rapid-input behavior was checked separately with real event processing in the browser suite.

| Moment | Desktop | Phone |
| --- | --- | --- |
| Decoded opening reveal | 520ms; 10px / 1.025 scale | 360ms; 6px / 1.015 scale |
| Entry into product | 340ms; 1.035 scale | 220ms; 6px and .82→1 opacity |
| Aligned finish crossfade | 190ms | 160ms |
| Opaque cart entry | 260ms; 35px horizontal | 200ms; 10px vertical |

The review prompted a final correction: removing opacity from the drawer animation prevents underlying product imagery from competing with shopping labels. The mobile duration override was also corrected to take precedence over the open-dialog selector. With reduced motion enabled, the final review observed zero running animations on both profiles.

## Source evidence and limits

Each finish contains 34 meshes and 138,376 triangles. The geometry/transform fingerprint is `07f67651782977314a7bc97d23685f8c02d164b0b49a568b39ec7d32020ed661`. Original overall bounds and the locked hero camera remain unchanged. The dedicated macro is rendered at 1400×1000 and exported without cropping at 1100×786. Source PNGs, GLB, four original procedural weave maps, camera matrices, hashes, and portable regeneration/verification scripts are retained in `assets/arc`.

Regeneration settings are 512 hero samples and 768 macro samples; PNGs do not encode historical sample counts, so those counts are not represented as verified capture provenance. The macro original has 15 transparent pixels in its dark cavity. Web exports explicitly flatten that tiny patch to the matching near-black background; original PNG bytes remain preserved. See [asset documentation](../assets/arc/README.md) for exact commands and evidence.

These checks cover installed Chromium browsers and phone emulation, not a physical iPhone/Safari or a full human screen-reader audit. Automated axe checks do not certify complete accessibility conformance. Local storage still belongs to the browser origin and intentionally falls back to memory when unavailable. No performance claims about real audio products are made.

Local Git author/committer identity is KareemAl1. Nothing was pushed or published; other projects were not edited or moved.
