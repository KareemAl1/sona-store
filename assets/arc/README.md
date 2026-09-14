# Sona Arc original product assets

The product is an original deterministic Three.js mesh assembly. No generated product photographs, stock imagery, downloaded meshes, or externally sourced textures are used.

## Source

- `model.js` authors the asymmetric oval shell cross-sections, cushioned oval openings, original woven textile texture, rounded broad headband, flattened yoke arms, pivots, control button, and microphone slot. It also defines the locked studio and camera.
- `render.js` uses `three-gpu-pathtracer` to path trace the same assembly for every finish.
- `index.html`, `serve.cjs`, and `capture.cjs` provide the reproducible rendering harness.
- `sona-arc-original.glb` is the native mesh assembly with the Pearl finish and the original woven normal map embedded.
- `sona-original-weave-height.png` and `sona-original-weave-normal.png` are the original procedural texture assets. `export-source.cjs` regenerates them and verifies matching mesh bounds and triangle counts for every finish.

Only material colors vary among Pearl, Graphite, and Fig. Geometry, camera, lights, environment, and crop are identical. The material detail uses the same scene with a closer camera.

## Reproduce

Dependencies: Three.js 0.186.0, three-gpu-pathtracer 0.0.24 (with peer dependencies), and Playwright. The supplied local paths in `serve.cjs` and `capture.cjs` point to the development environment used to create the assets; change those paths when moving the source.

Run `node serve.cjs`, then `node capture.cjs pearl path 1100 1500 256`. Repeat for `graphite` and `fig`. The detail asset uses `node capture.cjs pearl path 1200 1200 384 detail`. The raster mode is intended for geometry previews only. Final renders use the renderer's deterministic, edge-preserving DenoiseMaterial pass (no AI retouching).

Responsive square assets use `node capture.cjs pearl path 1100 1100 256` (repeat for the other finishes). These write separate `sona-{finish}-square.png` files and skip GLB export. Only camera aspect changes; position, target, vertical field of view, geometry, materials, and lighting stay fixed. Portrait and detail files are preserved.

Coordinates and light values are declared directly in the source. The procedural weave uses a fixed seed (`73241`), and all finish renderings use stable path-tracing noise.
