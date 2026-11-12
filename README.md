# The Test Kitchen — Cheeseburger AR

A static prototype that displays a burger in 3D and offers table placement on compatible iPhone and Android devices. No account, payment, or backend is required for visitors.

Live viewer: https://polypusinc-bit.github.io/rest-test-/

Google Sites menu: https://sites.google.com/view/the-test-kitchen-menu-demo

## Files

- `index.html`, `styles.css`, `viewer.js`: the page, appearance, and interactions.
- `cheeseburger.glb`: browser / Android model.
- `cheeseburger.usdz`: matching iPhone Quick Look model.
- `model-viewer.min.js`: pinned Google model-viewer 4.1.0.
- `MODEL-LICENSE.txt`, `source-manifest.json`: the model source license and metadata.
- `MODEL-VIEWER-LICENSE.txt`: the viewer library's Apache 2.0 license.

The model is from [Grab3D](https://grab3d.com/models/food/burger/), provided under CC0. A Sketchfab model was investigated, but its download required a separate sign-in. Grab3D describes the source as procedurally built with AI-assisted Blender scripts, with no generative AI geometry or textures. All model files are unmodified.

## Scale and ingredients

The GLB's vertex bounds measure **0.134265 m wide × 0.102726 m high × 0.132218 m deep**. Its lowest vertex is at Y=0. The source includes the matching USDZ. `ar-scale="fixed"` requests that AR viewers retain the authored physical scale. These are illustrative prototype dimensions, not measurements of a real restaurant portion.

The model has **one mesh and one material**. Individual ingredients cannot be cleanly toggled using simple mesh visibility. There is intentionally no fake “remove cheese” control. Stage 2 requires separately named ingredient meshes and matching saved GLB/USDZ variants so Android Scene Viewer and iPhone Quick Look receive the chosen configuration. Native AR viewers do not automatically inherit arbitrary browser scene changes.

## Run locally

From this folder, run `python3 -m http.server 8765`, then open `http://localhost:8765`. This is a computer preview; a localhost URL cannot be opened on someone else's phone. Publish over HTTPS for phone testing.

## Publish on GitHub Pages, step by step

1. Create a **public** repository named `rest-test-`.
2. Upload all the files in this folder into the repository root (do not upload the enclosing folder or only a ZIP).
3. Commit to `main`.
4. Open **Settings → Pages**.
5. Choose **Deploy from a branch**, **main**, and **/ (root)**. Save.
6. Wait for the Pages deployment to finish, then open the URL shown by GitHub.

## Connect the existing Google Sites menu

1. Open The Test Kitchen's Google Sites editor.
2. Use **Insert → Button** and label it **View Cheeseburger in 3D**.
3. Link it to the published GitHub Pages URL.
4. Place it alongside the cheeseburger item and click **Publish**.
5. Keep the existing QR code; it still opens the Google Sites menu.

## Phone acceptance test

Run this on both an iPhone (Safari) and an AR-compatible Android (Chrome):

1. Scan the existing QR code and open the menu.
2. Tap **View Cheeseburger in 3D**. Confirm the burger loads with textures.
3. Drag to rotate and pinch to zoom; test Reset view.
4. Tap **View on your table**. Allow camera access if asked.
5. On iPhone, switch to **AR** if Quick Look opens in Object mode.
6. Move the phone slowly over a well-lit, textured table. Place the burger.
7. Compare the burger to a ruler: roughly 13.4 cm across and 10.3 cm tall. Check it sits on the surface and stays anchored as you move.
8. Return to the browser and use Back to menu.

If AR is unavailable, the page still supports 3D. The help section includes a direct iPhone USDZ link. Camera placement, tracking, lighting, and native AR scale must be checked on physical phones; a desktop preview cannot verify them.

## Relevant documentation

- [Google model-viewer AR examples](https://modelviewer.dev/examples/augmentedreality/)
- [Google model-viewer docs](https://modelviewer.dev/docs/)
- [GitHub Pages publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
