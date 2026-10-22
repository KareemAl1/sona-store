# Product renders

Every product image in Sona is rendered from code. `arc/` holds the Arc headphones and `collection/` holds the Dot earbuds and the Room speaker.

- `model.js` builds the geometry: shells, woven cushions, stitching, grilles.
- `render.js` and `studio.js` set up the path-traced studio, materials and the shared fabric weave.
- Pearl, Graphite and Fig only change materials. The geometry and camera stay identical, so the images line up when you switch finishes.

## Rebuilding the images

Install dependencies from the project root with `npm ci`, then:

```sh
node assets/arc/serve.cjs                                # open the studio
node assets/arc/capture.cjs pearl path 1100 1100 512     # render one finish
node assets/arc/export-web.cjs                           # write the WebP files the store uses
node assets/arc/verify-refinement.cjs --check            # confirm finishes share geometry and camera
```

The `collection/` scripts work the same way and take the product name first, for example `node assets/collection/capture.cjs dot fig path 512`.

The `*-verification.json` files record the geometry hashes and camera values the checks compare against.
