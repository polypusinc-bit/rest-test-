# Compact stack update (V4)

All three dishes now compact their stacked layout after ingredient removal. Burger and sandwich ingredients use authored contact planes and cumulative visible-layer thickness. Pizza toppings share the cheese surface, or the sauce surface when mozzarella is absent; extra pepperoni rests on the regular pepperoni when present. Separate preserves the original inspection offsets. Native Quick Look recipes contain complete, uniquely named skeletal poses and matching rest transforms for every recipe/layout combination. Ingredient material selection remains intact for pizza/chicken; burger retains skeletal-scale removal.

The browser/WebXR assets contain a matching animation per recipe. The viewer waits for the selected animation to load, cancels stale updates, and applies the current layout. Editing ingredients preserves Stacked or Separated instead of forcing separation. Original burger geometry, materials, scripts and V3 AR assets are retained; index.html now selects the new versioned viewer and assets.

Validation: tools/test-compact-menu.py checks 512 recipes in both layouts across all three dishes, including matching GLB/USD positions and contact surfaces. tools/test-compact-burger-controls.cjs and tools/test-menu-controls.mjs check controls, resets and rapid changes. tools/compact-native-checks.txt records 18 Apple RealityKit import checks covering all included, all removed and partial recipes in both layouts. Native imports verify initial joint positions and recipe animation sources. Browser screenshots confirm stacked removals visually. Live physical iPhone and Android camera switching still requires phone testing.

Phone acceptance: close any earlier AR view, open menu.html?v=ios-menu-4, enter each dish, set Arrangement to Stacked, and remove/restore lower and middle ingredients without closing the camera. Remaining layers should settle together. Switch to Separated and back, and confirm the recipe remains selected.

## Three-dish menu prototype

Entry point: https://polypusinc-bit.github.io/rest-test-/menu.html

The original cheeseburger viewer remains at the repository root. All pre-existing hosted files are unchanged; their SHA-256 baseline is stored locally in `tools/burger-preservation-baseline.json`. The new menu links directly to the original burger page, avoiding an iframe or replacement burger controller.

New dish pages use `dish.html?dish=pizza` and `dish.html?dish=chicken`. They share `dish-viewer.js` and `dishes.js`; ingredient controls are generated from the dish definition. Changing dishes performs a full navigation so a stale model or iPhone package cannot carry across dishes. The controls reuse the burger's paused-animation seeking, WebXR overlay, and local USDZ packaging approach.

Pizza ingredients: Pepperoni, Mozzarella, Mushrooms, Olives, Onions, Jalapenos, Extra_Pepperoni. Crust includes the fixed tomato base. Default toppings: Pepperoni and Mozzarella.

Sandwich ingredients: Chicken, Lettuce, Tomato, Pickles, Mayonnaise, Cheese, Bacon, Spicy_Sauce. Bottom_Bun and Top_Bun are fixed visible meshes; the top bun still moves when layers separate. Default ingredients: Chicken, Lettuce, Tomato, Pickles, Mayonnaise.

Each GLB contains separate ingredient meshes and materials with the exact IDs above, vertex colors, and a `Separate layers` animation. The editable sources are `models-source/pizza.blend` and `models-source/chicken-sandwich.blend` in the local workspace. Optional extras are hidden for rendering in those files; all objects remain editable by name. Food is original procedural prototype geometry, not a scan.

The revised V3 iPhone files embed baked RGBA color textures. Every ingredient has a fixed material and shader binding. Flat default-prim variants switch only that material's texture between the colored atlas and a transparent image; opacity uses the texture alpha with a fixed 0.5 cutoff. This replaces V1's vertex-color shader and nested skeletal-scale variants, which the user reported as colorless and nonresponsive in camera AR. Each arrangement now selects a distinct, fully sampled skeletal animation (StackedPose or SeparatedPose) and a matching rest pose. This replaces the shared animation source used by V2 after reports of unreliable camera-view arrangement switching. Ingredient materials remain independent of arrangement. The sandwich also has flat cut bun faces and tighter filling positions; its updated GLB is versioned to bypass cached geometry. Crust/bun materials have no removal variants. The original `recipe-package.js` prepares the initial choices locally, and native iPhone choices still do not synchronize back to the webpage.

## Verified

- Every original hosted file matches its saved hash.
- All 128 pizza recipes and 256 sandwich recipes, each in both arrangements, compose to the expected visible/transparent textures and translations, retaining fixed bases.
- Apple USD checks, CRCs, 64-byte USDZ alignment, GLB object/material names and animation channels.
- Generated controls, defaults, all-removed/base-only state, repeated selection changes, WebXR overlay handlers in a mock session, reset, URL restore, iPhone download-failure gating, and local packaging of every recipe.
- Actual browser rendering for both new dishes, mixed toppings, layout changes, URL reload, navigation, and narrow-screen framing.

## Native import checks for V2

A headless check using Apple RealityKit on this Mac reproduced the V1 color problem: it imported one opaque FoodMaterial with no base-color texture. V2 imports a distinct textured material for each ingredient, with the expected alpha cutoff. Actual browser-generated all-included and all-removed packages were loaded through RealityKit for both dishes; checks assert that fixed bases retain their color texture and every configurable ingredient receives its expected colored or transparent texture.

These native import checks verify initial state and material setup, not interactive Quick Look switching or camera rendering on a physical iPhone. Those still need the phone checks below. V3 adds native import assertions for the exact joint positions and a single matching animation source in both arrangements, with all ingredients included and all removed, for both dishes. Evidence: tools/menu-ios-v3-native-checks.txt. All 128 pizza and 256 sandwich recipes were composed in both arrangements; original burger file hashes remain unchanged.

## Remaining phone acceptance checks

Desktop validation does not prove camera placement or native Quick Look/WebXR behavior. No physical iPhone or Android device was available for this release. Test both:

1. Open menu.html in Safari on iPhone or Chrome on an AR-compatible Android phone. Choose each dish and enter camera AR.
2. Place it on a table. Verify approximate scale and starting recipe.
3. Remove and restore every ingredient while the camera remains open. On iPhone use the configuration menu; on Android use the overlay buttons.
4. Test mixed selections, separate/stack, all configurable ingredients removed, and restoration. The pizza base and sandwich buns must remain visible.
5. Exit AR before switching dishes. Reopen the burger and confirm its original ingredient controls and camera behavior still work.

Browser UI and static assets are ready for device acceptance testing. Do not call camera behavior verified until these tests pass on real devices.
