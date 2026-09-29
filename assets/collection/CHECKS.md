# Collection asset verification — 29 September 2026

- All six finish originals completed 512 path-tracing samples. Both dedicated macros completed 768 samples, recorded directly from the rendering browser in the adjacent capture JSON files. Browser: Edge 154.0.4258.37.
- All eight final PNGs were visually inspected at their native composition. Each silhouette fits the square frame; finishes retain the same viewpoint and geometry. The dedicated macros show a different angle/material detail. No visible clipping defects or missing surfaces were found.
- `export-source.cjs --check` passed against the final source. For each product, Pearl/Graphite/Fig geometry hashes, bounds and projected pixel bounds are identical. Full cameras and source statistics are in `geometry-verification.json`.
- All eight retained originals have **zero non-opaque pixels**. The six square originals are 1100×1100 and the two macro originals are 1400×1000.
- `export-web.cjs --check` passed: all **14 WebP files** match fresh in-memory exports byte-for-byte. Square website files are 1100×1100 and 550×550; macros are 1100×786 with no crop. Every WebP is opaque.
- `verify-assets.cjs --check` passed against the frozen source, PNG, capture metadata, GLB and website hashes.
- The six CommonJS tooling files passed `node --check`.

These are asset checks, not storefront interaction or accessibility results. Product dimensions and material appearance describe fictional design geometry; no physical hardware performance is claimed. The checks were run in an isolated scratch asset directory with `SONA_PROJECT_ROOT` resolving the existing Sona dependencies and `SONA_EXPORT_DIR` directing exports to that scratch directory. No project checkout or existing Arc asset was modified by the asset task.
