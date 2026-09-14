# Sona Arc original product assets

Sona Arc is an original deterministic Three.js mesh assembly. `model.js` authors the oval shells, woven cushions, broad headband, flattened yokes, pivots, controls, and studio. `render.js` supplies the locked path-tracing setup and deterministic denoising. There are no downloaded models, stock photographs, external textures, or AI retouches.

Only finish material colors vary among Pearl, Graphite, and Fig. Square renders change camera aspect to 1; camera position, target, vertical field of view, geometry, and lighting stay fixed. The detail view uses the existing closer camera. The procedural weave seed is `73241`.

## Setup

Run all commands below **from the Sona project root**, where `package.json` lives. Install the locked project dependencies once:

```sh
npm ci
```

The scripts resolve `playwright`, `sharp`, Three.js, and the path tracer from project `node_modules`. Browser selection is: `SONA_BROWSER_PATH` when set, an installed Microsoft Edge in a standard location, then Playwright's Chromium. If neither Edge nor a Playwright browser is installed, install Chromium:

```sh
npx playwright install chromium
```

To select a browser explicitly, set `SONA_BROWSER_PATH` to its executable path in the shell running the capture/export command. For example, in PowerShell:

```powershell
$env:SONA_BROWSER_PATH = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
```

On macOS or Linux, use `export SONA_BROWSER_PATH='/absolute/path/to/browser'`. Direct3D flags apply only on Windows. GPU/browser differences can change render pixels slightly; the authored geometry and fixed camera settings remain the same.

## Start the studio

Keep this process running in one terminal while rendering or exporting source:

```sh
node assets/arc/serve.cjs
```

The studio opens at `http://127.0.0.1:4179`. It binds to loopback and serves only `assets/arc` and project `node_modules`, with both lexical and resolved-path containment checks. Stop it with Ctrl+C when finished.

## Render the square storefront images and detail

In a second terminal, from the project root:

```sh
node assets/arc/capture.cjs pearl path 1100 1100 256
node assets/arc/capture.cjs graphite path 1100 1100 256
node assets/arc/capture.cjs fig path 1100 1100 256
node assets/arc/capture.cjs pearl path 1200 1200 384 detail
```

These write `sona-pearl-square.png`, `sona-graphite-square.png`, `sona-fig-square.png`, and `sona-pearl-detail-path.png` beside the scripts. Square captures preserve the portrait PNGs and skip GLB export. The studio may need a minute to compile shaders before samples accumulate.

Keep **all seven original PNGs** in `assets/arc`: the three square images, three portrait images, and one detail image. To deliberately regenerate the portrait set, use:

```sh
node assets/arc/capture.cjs pearl path 1100 1500 256
node assets/arc/capture.cjs graphite path 1100 1500 256
node assets/arc/capture.cjs fig path 1100 1500 256
```

## Export the editable source and textures

With the studio still running:

```sh
node assets/arc/export-source.cjs
```

This exports `sona-arc-original.glb` in Pearl, both original woven texture PNGs, and `geometry-verification.json`. It checks that all finishes have matching mesh counts, triangle counts, and bounds before writing. The original assembly contains 30 meshes and 101,760 triangles.

## Export the website images

The studio is not needed for this step:

```sh
node assets/arc/export-web.cjs
```

This reads the retained original PNGs and writes to `public/images`:

| Inputs | Output names | Size | WebP quality |
| --- | --- | --- | --- |
| Three square PNGs | `arc-{finish}-1100.webp` | 1100 × 1100 | 88 |
| Three square PNGs | `arc-{finish}-550.webp` | 550 × 550 | 85 |
| Original detail PNG | `arc-detail.webp` | 1100 × 700, centered cover crop | 90 |

## Verify

These commands inventory the retained originals, check square dimensions and matching original hashes, and verify every WebP against a fresh in-memory export of its original PNG with the exact settings above:

```sh
node assets/arc/verify-assets.cjs
node assets/arc/verify-squares.cjs
node assets/arc/export-web.cjs --check
```

`verify-assets.cjs` refreshes `asset-verification.json`; `verify-squares.cjs` writes `square-verification.json`. To confirm the original portrait/detail files have not changed against an **existing** manifest, run `verify-squares.cjs` before refreshing it. Exact-black pixel counts are diagnostic; deep contact shadows can contain black pixels. Inspect the final images for rendering artifacts as well.

These tools generate local assets only; none of the commands publishes the website.
