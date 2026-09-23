# Sona Arc refined product assets

Sona Arc is an original deterministic Three.js assembly. `model.js` authors the oval shells, woven cushions, padded headband, flattened yokes, pivots, controls, stitches, and studio. `render.js` supplies the fixed path-tracing setup and material-aware denoising. The refinement adds alternating warp/weft yarns, procedural albedo/normal/roughness maps, sewn cushion seams, and a rounded padded headband underside. The weave seed is `73241`. No downloaded model, stock photograph, external texture, or AI retouch is used.

Only material colors vary across Pearl, Graphite, and Fig. Each refined assembly has **34 meshes and 138,376 triangles**. SHA-256 of the world transforms, position/normal/UV arrays and indices is identical for all three finishes:

```text
07f67651782977314a7bc97d23685f8c02d164b0b49a568b39ec7d32020ed661
```

The original overall bounds remain unchanged. Hero images use one locked camera at `[7.2, 3.45, 6.8]`, aimed at `[0, 1.94, 0]`, with a 30-degree vertical field of view and aspect ratio 1. All vertices project into the same 1100-pixel image bounds: x `298.973966…`–`824.389336…`, y `103.748537…`–`960.825936…`. `geometry-verification.json` and `camera-verification.json` retain the full-precision values. `verify-refinement.cjs` rebuilds each finish from the current source, verifies identical transforms and geometry, compares the full camera matrices, and hashes the actual source and retained renders.

The dedicated macro uses camera `[-3.4, 2.3, 3.8]`, target `[0.74, 1.34, 0.1]`, a 22-degree field of view and aspect ratio 1.4. It is a separate native 1400 × 1000 render, showing cushion weave and sewn construction. It is not a crop of a hero image.

## Setup

Run commands **from the Sona project root**, where `package.json` lives:

```sh
npm ci
```

Scripts resolve `sharp`, `playwright`, Three.js and the path tracer through project dependencies. The studio serves `../../node_modules` relative to `assets/arc`; scripts contain no machine-specific dependency paths.

Browser selection is `SONA_BROWSER_PATH` when set, an installed Microsoft Edge in a standard location, then Playwright Chromium. If needed, install the browser with:

```sh
npx playwright install chromium
```

Set `SONA_BROWSER_PATH` to a browser executable to override selection. Direct3D flags apply only on Windows. Browser/GPU differences can change render pixels; geometry and camera settings are deterministic.

## Studio and rendering

Start the local studio in one terminal:

```sh
node assets/arc/serve.cjs
```

It binds only to `http://127.0.0.1:4179` and serves `assets/arc` plus project `node_modules`, with lexical and resolved-path containment checks. Stop it with Ctrl+C when finished.

In a second terminal, the regeneration commands are:

```sh
node assets/arc/capture.cjs pearl path 1100 1100 512
node assets/arc/capture.cjs graphite path 1100 1100 512
node assets/arc/capture.cjs fig path 1100 1100 512
node assets/arc/capture.cjs pearl path 1400 1000 768 detail
```

These write the three `sona-{finish}-square.png` files and `sona-pearl-macro.png`. **512 and 768 are regeneration settings, not verified historical sample counts:** the supplied PNGs do not encode capture sample counts. Their byte hashes in `refinement-verification.json` identify the inspected final renders.

The three square originals are 1100 × 1100. All four final renders were visually inspected for framing, material detail and visible rendering defects. The retained macro has 15 zero-alpha pixels inside its dark ear cavity, at x704–708/y771–775. The web exporter composites inputs over near-black `#0d0a10` before resizing, so the website cannot show through those pixels. It preserves the original PNG bytes and the verifier records their transparency diagnostic. All website outputs are opaque.

## Editable source export

With the studio running:

```sh
node assets/arc/export-source.cjs
```

This exports the refined Pearl assembly as `sona-arc-original.glb`, four procedural 1024 × 1024 maps (`height`, `normal`, `albedo`, `roughness`), and the geometry/camera manifests. The export checks matching finish geometry before writing.

## Website export

The studio is not needed for this step:

```sh
node assets/arc/export-web.cjs
```

| Input | Output | Dimensions | WebP quality |
| --- | --- | --- | --- |
| Three refined square PNGs | `arc-{finish}-1100.webp` | 1100 × 1100 | 92 |
| Three refined square PNGs | `arc-{finish}-550.webp` | 550 × 550 | 90 |
| `sona-pearl-macro.png` | `arc-detail.webp` | 1100 × 786 | 92 |

Outputs go to `public/images`. Resizing is proportional by width only, with no crop; the macro's fractional height rounds to 786 pixels. Use the macro at its own aspect ratio in the page so its material detail is retained.

## Verification

With the studio running, verify the frozen refinement and web export:

```sh
node assets/arc/export-web.cjs --check
node assets/arc/verify-refinement.cjs --check
```

The verifier checks current source hashes, source geometry across all three finishes, matching hero cameras and projected bounds, retained PNG dimensions/hashes, GLB mesh/triangle counts, and every WebP against a fresh in-memory export with the documented settings. It never rerenders the product. The manifest records Sharp/libvips and Three versions; use the locked dependencies for byte-identical WebP checks.

After an intentional source or render update, inspect the new images, regenerate source exports and website images, then record the new refinement manifest:

```sh
node assets/arc/verify-refinement.cjs
```

Recording a manifest does not substitute for visual inspection. Use `--check` before refreshing the manifest when checking the supplied frozen delivery.

## Historical originals

Existing portrait PNGs and `sona-pearl-detail-path.png` belong to the earlier model. They remain historical originals and **do not depict the refined geometry**. Older asset/square verification manifests describe that earlier delivery. The current website export reads only the three refined square originals and the new macro; no portrait or old detail file is a final export input.

The scratch `before/` directory preserves earlier source and renders for comparison. It is not needed to run the refined pipeline. Intermediate detail experiments are also excluded from the final delivery. None of these commands publishes a website.
