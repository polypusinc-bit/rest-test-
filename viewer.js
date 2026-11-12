const viewer = document.querySelector('#burger');
const launch = document.querySelector('#launch-ar');
const nativeAR = document.querySelector('.native-ar-button');
const status = document.querySelector('#viewer-status');
const loading = document.querySelector('#loading-indicator');
const retry = document.querySelector('#retry');
const phoneNote = document.querySelector('#phone-note');
const reset = document.querySelector('#reset-view');
const toggle = document.querySelector('#toggle-cheese');
const cheeseStatus = document.querySelector('#cheese-status');
const cheeseChip = document.querySelector('#cheese-chip');
const iosFallback = document.querySelector('#ios-fallback');
const arToggle = document.querySelector('#ar-toggle-cheese');
const arCheeseStatus = document.querySelector('#ar-cheese-status');
const arCustomizer = document.querySelector('#ar-customizer');
const variants = {
  withCheese: { glb: 'cheeseburger.glb', usdz: 'burger-interactive.usdz', label: 'Cheese included' },
  withoutCheese: { glb: 'burger-no-cheese.glb', usdz: 'burger-interactive-no-cheese.usdz', label: 'No cheese' }
};
let selected = new URL(location.href).searchParams.get('cheese') === 'off' ? 'withoutCheese' : 'withCheese';
let loaded = false;
let launching = false;
let presenting = false;
let failed = false;
let loadTimer;

function refreshControls() {
  const supported = loaded && viewer.canActivateAR;
  launch.disabled = !supported || launching || presenting;
  nativeAR.disabled = !supported || launching || presenting;
  toggle.disabled = (!loaded && !failed) || launching || presenting;
  arToggle.disabled = (!loaded && !failed) || !presenting;
  reset.disabled = !loaded;
  launch.textContent = failed ? 'Model unavailable' : launching ? 'Opening AR…' : supported ? 'View on your table  ↗' : loaded ? 'AR requires a compatible phone' : 'Loading your burger…';
  phoneNote.hidden = !loaded || supported;
  viewer.classList.toggle('is-loading', !loaded);
  if (loaded && !launching && !presenting) {
    iosFallback.href = `${variants[selected].usdz}#allowsContentScaling=0`;
    iosFallback.removeAttribute('aria-disabled');
  } else {
    iosFallback.removeAttribute('href');
    iosFallback.setAttribute('aria-disabled', 'true');
  }
}

function renderSelection() {
  const removed = selected === 'withoutCheese';
  toggle.textContent = removed ? 'Add Cheese' : 'Remove Cheese';
  arToggle.textContent = toggle.textContent;
  arToggle.setAttribute('aria-label', removed ? 'Add cheese' : 'Remove cheese');
  toggle.setAttribute('aria-label', removed ? 'Add cheese' : 'Remove cheese');
  toggle.setAttribute('aria-pressed', String(removed));
  cheeseChip.classList.toggle('omitted', removed);
  cheeseChip.setAttribute('aria-label', removed ? 'Cheese removed' : 'Cheese included');
  cheeseStatus.textContent = `${variants[selected].label}${loaded ? '' : failed ? ' · preview unavailable' : ' · updating preview…'}`;
  arCheeseStatus.textContent = cheeseStatus.textContent;
  viewer.alt = `A sesame-bun burger with beef, ${removed ? 'no cheese, ' : 'cheese, '}lettuce, tomato and red onion. Drag or use arrow keys to rotate.`;
}

function beginLoad() {
  loaded = false;
  failed = false;
  launching = false;
  loading.hidden = false;
  retry.hidden = true;
  status.textContent = 'Updating the 3D preview and AR selection…';
  refreshControls();
  renderSelection();
  // WebXR stays in the same session while the model changes. Quick Look
  // gets both recipes plus a default matching the webpage selection.
  viewer.setAttribute('ios-src', variants[selected].usdz);
  viewer.setAttribute('src', variants[selected].glb);
  clearTimeout(loadTimer);
  loadTimer = setTimeout(() => {
    if (!customElements.get('model-viewer')) showError();
    else if (!loaded) {
      status.textContent = 'Still loading your selection. Check your connection or try again.';
      retry.hidden = false;
    }
  }, 20000);
}

function showError() {
  clearTimeout(loadTimer);
  loaded = false;
  failed = true;
  loading.hidden = true;
  retry.hidden = false;
  refreshControls();
  renderSelection();
  status.textContent = 'Your selected burger could not load. Try again or change the cheese selection. AR is paused until the correct model loads.';
}

viewer.addEventListener('load', event => {
  const expected = new URL(variants[selected].glb, document.baseURI).href;
  if (event.detail?.url && new URL(event.detail.url, document.baseURI).href !== expected) return;
  clearTimeout(loadTimer);
  loaded = true;
  failed = false;
  loading.hidden = true;
  retry.hidden = true;
  refreshControls();
  renderSelection();
  status.textContent = viewer.canActivateAR ? `${variants[selected].label}. Ready to view on your table.` : `${variants[selected].label}. Drag to explore in 3D; open on a compatible phone for AR.`;
});
viewer.addEventListener('error', showError);
viewer.addEventListener('ar-status', event => {
  const state = event.detail.status;
  presenting = state === 'session-started' || state === 'object-placed';
  if (presenting || state === 'failed' || state === 'not-presenting') launching = false;
  refreshControls();
  if (state === 'failed') status.textContent = 'AR could not start. Open “AR didn’t open?” below for help.';
});
function changeCheese() {
  selected = selected === 'withCheese' ? 'withoutCheese' : 'withCheese';
  const url = new URL(location.href);
  if (selected === 'withoutCheese') url.searchParams.set('cheese', 'off');
  else url.searchParams.delete('cheese');
  history.replaceState(null, '', url);
  beginLoad();
}
toggle.addEventListener('click', () => { if (!toggle.disabled) changeCheese(); });
arToggle.addEventListener('click', () => { if (!arToggle.disabled) changeCheese(); });
// A tap on a control must not also place or move the burger.
arCustomizer.addEventListener('beforexrselect', event => event.preventDefault());
launch.addEventListener('click', async () => {
  if (!loaded || !viewer.canActivateAR || launching || presenting) return;
  launching = true;
  refreshControls();
  try { await viewer.activateAR(); }
  catch { status.textContent = 'AR could not start. Try Safari on iPhone or Chrome on a supported Android phone.'; }
  finally { launching = false; refreshControls(); }
});
reset.addEventListener('click', () => {
  viewer.cameraOrbit = '30deg 70deg 0.38m';
  viewer.cameraTarget = 'auto auto auto';
  viewer.fieldOfView = 'auto';
});
retry.addEventListener('click', () => location.reload());
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) { launching = false; refreshControls(); }
});
beginLoad();
