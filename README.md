# The Test Kitchen — build your burger in 3D and AR

Live viewer: https://polypusinc-bit.github.io/rest-test-/
Menu / existing QR destination: https://sites.google.com/view/the-test-kitchen-menu-demo

A free, static fictional restaurant prototype. Visitors can independently add/remove the top bun (including sesame seeds), red onion, tomato, lettuce, cheese, beef patty, and bottom bun.

## Interactions

- Choosing an ingredient lifts the layers apart. Removed ingredients disappear after the lift; added ingredients reappear.
- **Separate layers / Stack burger** changes the arrangement; **Reset recipe** restores the original burger.
- The URL retains the recipe and arrangement across reloads. Older `?cheese=off` links still work.
- Reduced-motion preferences skip the animation.
- On supported Android Chrome devices, the same controls appear inside WebXR camera AR. UI taps do not also place/move the model. Scene Viewer is excluded because it cannot display these controls.
- On iPhone Safari, Quick Look exposes seven **Included / Removed** configuration menus plus **Arrangement → Separated / Stacked**. This is native configuration switching, not the webpage's smooth animation. Changes in Quick Look do not synchronize back to the webpage.
- The iPhone file is prepared locally in the browser with the selected initial recipe and layout. Every file still contains every ingredient option. No recipe data is uploaded to a server. If preparation fails, the iPhone launch is disabled and a retry is offered.

## Model and files

The source model is [Grab3D's CC0 burger](https://grab3d.com/models/food/burger/). Grab3D describes it as procedural geometry made with AI-assisted Blender scripts. Original `cheeseburger.glb` and `cheeseburger.usdz` remain unchanged.

- `burger-layers.glb`: seven meshes and named materials; one lift animation. All 28,160 original triangles, source textures and original physical scale are preserved. Onion and tomato pieces are grouped; sesame seeds stay with the top bun.
- `burger-customizable.usdz`: self-contained native configuration model with eight variant sets on its default prim, shared textures, and a textual recipe layer. Geometry matches the GLB by triangle vertex position.
- `recipe-package.js`: reads the stored ZIP, updates default variant choices, and writes an uncompressed USDZ with CRC32 and 64-byte payload alignment. The browser supplies this as a blob URL to Quick Look.
- `ingredients.json`: triangle counts and vertical lift offsets.
- `index.html`, `styles.css`, `viewer.js`: responsive page and interaction logic.
- `model-viewer.min.js`: pinned Google model-viewer 4.1.0, Apache 2.0 license alongside it.
- Original and earlier cheese-only variants are retained for existing links.

The stacked model is roughly 13.4 cm wide × 10.3 cm high × 13.2 cm deep. Separation adds up to 15 cm of vertical lift without scaling ingredients. These are illustrative prototype dimensions, not measurements of real food. Removing an ingredient leaves its gap; **Stack burger** restores the original layer positions rather than compressing the remaining geometry.

## Validation

Asset checks cover all seven layer groups with no duplicated or missing source triangles, USD composition for each ingredient and arrangement, and matching source geometry. Packaging tests cover all 128 ingredient combinations, both arrangements, unchanged geometry/textures, CRC checks, USD parsing and 64-byte alignment. Control tests cover empty recipes, AR controls, lift/stack, reset, URL restore and matching iPhone defaults. Browser checks cover visible ingredient changes, separated/stacked views, responsive layout and reload persistence.

Physical-phone camera tracking, placement, Quick Look configuration menus and animated Android AR require on-device acceptance testing; desktop checks cannot verify them.

## Phone acceptance test

1. Open the live viewer using Safari on a current iPhone and Chrome on a compatible Android phone. The original menu QR still works.
2. Remove several ingredients, then restore them. Confirm the top bun's sesame seeds move with it and both tomato slices toggle together.
3. Test Separate layers, Stack burger and Reset recipe. Reload a customized URL.
4. Enter AR. Confirm the starting ingredients and arrangement match the page.
5. Android: toggle each ingredient and stack/separate while the camera stays open. Ensure controls do not reposition the burger.
6. iPhone: change each Included/Removed option and Arrangement in the configuration menu. Confirm changes work without leaving AR. Update iOS if the menu is unavailable.
7. Test all ingredients removed, restore one, and restore the full burger. Check tracking, scale and table placement. Exit and re-enter AR.

## Run / publish

Serve this directory with `python3 -m http.server 8765`. Use HTTPS GitHub Pages for phone AR; a computer's localhost address is not a shareable phone link. Upload changed files into the existing repository root and commit to main; Pages deploys automatically. Preserve the existing public URLs and QR code.

## References

- [Google model-viewer AR and DOM overlays](https://modelviewer.dev/examples/augmentedreality/)
- [Google model-viewer animation](https://modelviewer.dev/examples/animation/)
- [Apple Quick Look configurations, including iOS](https://developer.apple.com/videos/play/wwdc2024/10105/)
- [Apple USD variant authoring](https://developer.apple.com/documentation/usd/creating-usd-files-for-apple-devices)
