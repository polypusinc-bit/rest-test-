# The Test Kitchen

Version 6 adds the bolder restaurant design, a shared direct ingredient editor, drag-to-bin with a labeled ghost, Undo, and compact WebXR controls. Browser 3D gestures have been checked; physical WebXR camera acceptance remains pending. Quick Look retains native controls and cannot run the new web gestures. See [interaction notes and device checklist](INTERACTION-NOTES.txt).

A buildless, three-dish menu with shared customization, demo pricing and the existing model-viewer 4.1.0 AR mechanism. The primary customer menu is [menu.html?r=test-kitchen](https://polypusinc-bit.github.io/rest-test-/menu.html?r=test-kitchen). [Harbor Lunch Club](https://polypusinc-bit.github.io/rest-test-/menu.html?r=harbor-demo) demonstrates a second fictional restaurant without copying application code.

`menu-data.json` owns restaurant branding, dish assets/defaults/mappings, availability and integer prices. `menu-core.js` validates menu data and handles pricing, query routes and restaurant/dish-scoped local persistence. `app.js` renders the menu and shared customization screen; `ar-viewer.js` preserves the prior material-alpha controls, per-recipe animation seeking, WebXR overlay and native USDZ packaging. `recipe-package.js`, the viewer dependency, burger/pizza V4 assets and original source geometry are unchanged.

The browser and compatible Android WebXR show the page's recipe and running demo price. iPhone Quick Look receives the initial page recipe; native changes stay inside Quick Look and do not update the page or its price. The interface states this limitation. No checkout, tax, service fee, payment or order submission is implemented.

## Asset limits

All models are illustrative. Burger preserves its existing seven controls/defaults; its model has no separate pickles, bacon or extra-patty geometry, so those choices are not offered. Pizza crust/sauce stay fixed. Chicken and buns now stay fixed in both browser controls and its V5 native configuration; only that package's configuration wrapper changes, with geometry/material payloads unchanged. Native model mappings and GLB animation recipeOrder are preparation data, not editable customer labels. Adding options needs prepared geometry and matching AR exports.

## Hosting and recovery

Verified GitHub Pages uses `main` and `/ (root)` with HTTPS. This source directory maps to the repository root. No build or install step is required. Serve locally with `python3 -m http.server 8765 --directory test-kitchen-ar` from the workspace. Query URLs work on direct opening and refresh; `/` remains a burger route for old links.

The pre-redesign remote baseline is commit `57ad2c23fa935d4f9ba4347e497d8943f89095c6`. Restore baseline files in a new commit for rollback. Older models/controllers remain available. Workspace `docs/DEPLOYMENT.txt` contains detailed instructions and local backup locations.

## Validation and remaining work

Workspace tests: `node --test tests/*.test.mjs` covers data validation, pricing, reset, state isolation, routes, multiple-material mappings, missing assets/mappings, iPhone file failure gating and shared AR controls in mocks. Model composition checks cover every recipe and layout; fixed-chicken checks verify 128 native recipes in both layouts. Desktop browser previews cover mobile/desktop, prices, saved selections, second branding, unavailable/invalid links and all three models. These are not physical camera tests.

Owner editing is blocked by missing backend/auth access. Workspace `backend/schema.sql` and `docs/OWNER-SETUP.txt` provide a proposed Supabase foundation, required server validation/publishing work and two-owner authorization tests. It has not been deployed or tested against a real database. There is no fake login or local-only admin dashboard.

[The pilot guide and downloadable feedback form](pilot.html) provide separate iPhone/Android tests and a QR for the public menu. The feedback form only downloads a text file; it does not submit responses online. The original Google Sites page remains published; its printed QR codes retain their original destination. `docs/GOOGLE-SITES.txt` explains how to link that page to the custom menu.
