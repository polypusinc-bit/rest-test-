const viewer = document.querySelector('#burger');
const launch = document.querySelector('#launch-ar');
const status = document.querySelector('#viewer-status');
const loading = document.querySelector('#loading-indicator');
const retry = document.querySelector('#retry');
const phoneNote = document.querySelector('#phone-note');
const reset = document.querySelector('#reset-view');
let loaded = false;
let launching = false;

function refreshARAvailability() {
  const supported = loaded && viewer.canActivateAR;
  launch.disabled = !supported || launching;
  launch.textContent = launching ? 'Opening AR…' : supported ? 'View on your table  ↗' : loaded ? 'AR requires a compatible phone' : 'Loading 3D model…';
  phoneNote.hidden = !loaded || supported;
}

function showError() {
  loaded = false;
  loading.hidden = true;
  retry.hidden = false;
  reset.disabled = true;
  launch.disabled = true;
  launch.textContent = 'Model unavailable';
  status.textContent = 'The burger could not load. Check your connection and try again.';
}

viewer.addEventListener('load', () => {
  loaded = true;
  loading.hidden = true;
  retry.hidden = true;
  reset.disabled = false;
  refreshARAvailability();
  status.textContent = viewer.canActivateAR ? 'Ready. Find a well-lit table and tap above to begin.' : '3D is ready. Drag the burger to explore it from every angle.';
});
viewer.addEventListener('error', showError);
viewer.addEventListener('ar-status', event => {
  if (event.detail.status === 'failed') {
    launching = false;
    refreshARAvailability();
    status.textContent = 'AR could not start. Open “AR didn’t open?” below for help. You can still explore in 3D.';
  } else if (event.detail.status === 'not-presenting') {
    launching = false;
    refreshARAvailability();
  }
});
launch.addEventListener('click', async () => {
  if (!loaded || !viewer.canActivateAR || launching) return;
  launching = true;
  refreshARAvailability();
  try { await viewer.activateAR(); }
  catch { status.textContent = 'AR could not start. Try Safari on iPhone or Chrome on a supported Android phone.'; }
  finally { launching = false; refreshARAvailability(); }
});
reset.addEventListener('click', () => {
  viewer.cameraOrbit = '30deg 70deg 0.38m';
  viewer.cameraTarget = 'auto auto auto';
  viewer.fieldOfView = 'auto';
});
retry.addEventListener('click', () => window.location.reload());
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) { launching = false; refreshARAvailability(); }
});
window.setTimeout(() => {
  if (!customElements.get('model-viewer')) showError();
  else if (!loaded) {
    status.textContent = 'Still loading the 3D model. On a slow connection, this may take a moment.';
    retry.hidden = false;
  }
}, 20000);
