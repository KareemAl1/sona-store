# Sona — The Listening Room

An original audio storefront portfolio project. Milestone one covers the homepage, Arc in Pearl/Graphite/Fig, and a persistent local cart. Products and prices are fictional. There are no payments, orders, accounts, or backend services.

## Local development

Requires Node.js 22.12+ and npm. From this folder:

```sh
npm ci
npm run dev
```

The preview is fixed at `http://127.0.0.1:4173`. The fixed origin matters because browser storage belongs to an origin. Port 4173 is strict: Vite will report a conflict instead of silently selecting another origin.

```sh
npm run build
npm test
npm run test:e2e
```

The browser tests use installed Microsoft Edge on Windows when available, otherwise Playwright's Chromium. On another machine run `npx playwright install chromium` once. Tests can reuse the running preview or start it automatically.

## Project guide

- `src/App.tsx`: real routes, URL-driven finish and bag state, native dialog, editorial pages.
- `src/ProductGallery.tsx`: aligned original renders and optional motion.
- `src/cart/`: validated persistence, pure cart mutations, React state.
- `src/styles.css`: responsive art direction, self-hosted fonts, reduced motion.
- `assets/arc/`: original geometry, textures, GLB, render pipeline, and alignment evidence.
- `tests/journey.spec.ts`: browser journey, history, keyboard, storage failure, accessibility, screenshots.
- `tests/resilience.spec.ts`: rapid input, unavailable images, route focus, scroll restoration, narrow layouts, enlarged text.
- `tests/motion.spec.ts`: delayed-image reveal, retained finish preview, interrupted motion, live reduced-motion changes, and deliberate backdrop dismissal.
- `docs/engineering.md`: decisions and tradeoffs.
- `docs/refinement.md`: current visual refinement results, comparison captures, and limitations.
- `docs/verification.md`: historical initial milestone verification.
- `docs/refinement/compare.html`: desktop and phone before/after screenshots from actual browsers.
- `docs/screenshots/`: browser captures from the implemented UI.

The project is local only. No remote repository or hosting has been configured. Local commits use KareemAl1, verified before committing. Other projects are independent and are not imported or modified.
