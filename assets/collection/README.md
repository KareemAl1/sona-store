# Sona collection — original Dot and Room assets

These are original fictional product studies created for Sona. `model.js` authors the complete geometry: Dot earbuds in an open case, and Room, a rounded home speaker with a woven front. `studio.js` reuses the deterministic Sona weave (seed `73241`), finish palette and studio environment authored for Arc. No downloaded model, third-party texture, stock photograph or AI retouch is used. Existing Arc assets are unchanged.

Only finish materials vary between Pearl, Graphite and Fig. Each product uses identical geometry, transforms and hero camera for all finishes. Geometry dimensions are modeling coordinates, not real-world technical specifications or performance claims.

| Assembly | Meshes | Triangles | Geometry SHA-256 |
| --- | ---: | ---: | --- |
| Dot | 34 | 110,972 | `795a8d10b2789559825971b27a87c026238129d79c67dc08454ada7e7d6b8db7` |
| Room | 54 | 28,968 | `4fad1df3c5209c884369193a34237be412b7931b542dab83df6b0c2cbb1c798f` |

`geometry-verification.json` records full geometry hashes, world-space bounds, projected pixel bounds and camera matrices. `export-source.cjs --check` rebuilds the current source and compares those actual values. Exported Pearl GLBs preserve editable mesh assemblies; the JavaScript is the source of truth for every finish.

## Reproduce locally

Use the locked Sona project dependencies, from the Sona project root. The tools live in `assets/collection` and normally resolve dependencies and website outputs relative to that directory:

```sh
npm ci
node assets/collection/serve.cjs
```

The asset studio binds only to `http://127.0.0.1:4180`. It serves this directory and the project's dependencies with lexical and resolved-path containment checks. The normal storefront uses a separate port.

In a second terminal:

```sh
node assets/collection/capture.cjs dot pearl path 512
node assets/collection/capture.cjs dot graphite path 512
node assets/collection/capture.cjs dot fig path 512
node assets/collection/capture.cjs room pearl path 512
node assets/collection/capture.cjs room graphite path 512
node assets/collection/capture.cjs room fig path 512
node assets/collection/capture.cjs dot pearl path 768 detail
node assets/collection/capture.cjs room pearl path 768 detail
node assets/collection/export-source.cjs
node assets/collection/export-web.cjs
```

Square originals are 1100×1100. Each macro is a separate native 1400×1000 render with its own camera, not a hero crop. Dot's macro exposes the opposite earbud face, satin/metal trim, silicone tip and molded cradle. Room's macro shows the upper woven face, sewn perimeter and machined top control. All eight path-traced images use five bounces, deterministic noise and the existing material-aware denoising pass. Per-render capture JSON records the actual completed sample count, dimensions and browser version. GPU/browser differences may change rendered pixels.

The browser helper uses `SONA_BROWSER_PATH` when set, otherwise installed Edge, then Playwright Chromium. `SONA_PROJECT_ROOT` can point to an existing dependency root for isolated asset work. `SONA_EXPORT_DIR` can redirect web exports during review. These optional environment settings avoid machine-specific paths in the source.

## Export and verify

Website images are opaque WebP: 1100px square at quality 92, 550px square at quality 90, and proportional 1100×786 macros at quality 92. Export flattens against `#0d0a10` and resizes by width only; no crop or retouch. Original PNGs are retained.

```sh
node assets/collection/export-source.cjs --check
node assets/collection/export-web.cjs --check
node assets/collection/verify-assets.cjs --check
```

The first check proves actual source geometry/camera alignment; the second reproduces all 14 WebP buffers and compares bytes; the third checks frozen source/render/GLB/export hashes, dimensions, completed sample metadata and transparency diagnostics. `asset-verification.json` is the frozen delivery manifest. After intentional source changes and visual inspection, rerender/export and run `verify-assets.cjs` without `--check` to record a new manifest. Recording it does not replace visual inspection.

No command publishes or uploads anything. The fictional forms and rendered materials should be described as design studies rather than tested physical products.
