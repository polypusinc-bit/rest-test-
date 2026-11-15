# Three-dish menu prototype

Entry point: https://polypusinc-bit.github.io/rest-test-/menu.html

The original cheeseburger viewer remains at the repository root. All pre-existing hosted files are unchanged; their SHA-256 baseline is stored locally in `tools/burger-preservation-baseline.json`. The new menu links directly to the original burger page, avoiding an iframe or replacement burger controller.

New dish pages use `dish.html?dish=pizza` and `dish.html?dish=chicken`. They share `dish-viewer.js` and `dishes.js`; ingredient controls are generated from the dish definition. Changing dishes performs a full navigation so a stale model or iPhone package cannot carry across dishes. The controls reuse the burger's paused-animation seeking, WebXR overlay, and local USDZ packaging approach.

Pizza ingredients: Pepperoni, Mozzarella, Mushrooms, Olives, Onions, Jalapenos, Extra_Pepperoni. Crust includes the fixed tomato base. Default toppings: Pepperoni and Mozzarella.

Sandwich ingredients: Chicken, Lettuce, Tomato, Pickles, Mayonnaise, Cheese, Bacon, Spicy_Sauce. Bottom_Bun and Top_Bun are fixed visible meshes; the top bun still moves when layers separate. Default ingredients: Chicken, Lettuce, Tomato, Pickles, Mayonnaise.

Each GLB contains separate ingredient meshes and materials with the exact IDs above, vertex colors, and a `Separate layers` animation. The editable sources are `models-source/pizza.blend` and `models-source/chicken-sandwich.blend` in the local workspace. Optional extras are hidden for rendering in those files; all objects remain editable by name. Food is original procedural prototype geometry, not a scan.

Each iPhone USDZ uses one skeleton. Ingredient variants change skeletal scale; arrangement changes translation. Fixed base scales remain one in every recipe. Nested variants encode combinations because USD scale arrays are atomic. The same `recipe-package.js` used by the burger supplies the current starting recipe without uploading choices. iPhone's native choices do not synchronize back to the webpage.

## Verified

- Every original hosted file matches its saved hash.
- All 128 pizza recipes and 256 sandwich recipes, each in both arrangements, compose to the expected scales/translations and retain fixed bases.
- Apple USD checks, CRCs, 64-byte USDZ alignment, GLB object/material names and animation channels.
- Generated controls, defaults, all-removed/base-only state, repeated selection changes, WebXR overlay handlers in a mock session, reset, URL restore, iPhone download-failure gating, and local packaging of every recipe.
- Actual browser rendering for both new dishes, mixed toppings, layout changes, URL reload, navigation, and narrow-screen framing.

## Remaining phone acceptance checks

Desktop validation does not prove camera placement or native Quick Look/WebXR behavior. No physical iPhone or Android device was available for this release. Test both:

1. Open menu.html in Safari on iPhone or Chrome on an AR-compatible Android phone. Choose each dish and enter camera AR.
2. Place it on a table. Verify approximate scale and starting recipe.
3. Remove and restore every ingredient while the camera remains open. On iPhone use the configuration menu; on Android use the overlay buttons.
4. Test mixed selections, separate/stack, all configurable ingredients removed, and restoration. The pizza base and sandwich buns must remain visible.
5. Exit AR before switching dishes. Reopen the burger and confirm its original ingredient controls and camera behavior still work.

Browser UI and static assets are ready for device acceptance testing. Do not call camera behavior verified until these tests pass on real devices.
