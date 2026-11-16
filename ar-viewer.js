import {readStoredZip,makeRecipePackage} from './recipe-package.js?v=layers-1';
import {defaults as defaultRecipe,saveSelection as persistSelection} from './menu-core.js?v=5';
export function startViewer({restaurant,dish,selection,storage,onChange}){
const viewer=document.querySelector('#dish');
const launch=document.querySelector('#launch-ar');
const nativeAR=document.querySelector('.native-ar-button');
const status=document.querySelector('#viewer-status');
const loading=document.querySelector('#loading-indicator');
const retry=document.querySelector('#retry');
const phoneNote=document.querySelector('#phone-note');
const iosFallback=document.querySelector('#ios-fallback');
const buttons=[...document.querySelectorAll('[data-ingredient]')];
const layouts=[...document.querySelectorAll('[data-layout]')];
const resets=[...document.querySelectorAll('[data-reset]')];
const ids=dish.recipeOrder;
const names=Object.fromEntries(dish.options.map(o=>[o.id,o.label]));
const defaults=defaultRecipe(dish);
const recipe={...selection.recipe};
let separated=selection.separated;
let loaded=false,failed=false,presenting=false,launching=false,animating=false;
let iosReady=false,iosError=false,packageEntries=null,blobUrl=null;
let animationTimer,packageTimer;
const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(/Mac/.test(navigator.userAgent)&&navigator.maxTouchPoints>1);
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
function saveSelection(){
 const url=new URL(location.href);url.searchParams.set('r',restaurant.slug);url.searchParams.set('dish',dish.id);url.searchParams.delete('cheese');
 url.searchParams.set('omit',dish.options.filter(o=>!recipe[o.id]).map(o=>o.id).join(','));
 url.searchParams.set('layers',separated?'apart':'stacked');history.replaceState(null,'',url);
 persistSelection(restaurant,dish,recipe,separated,storage);
}
function render(){
 const ready=loaded&&(!isIOS||iosReady);
 for(const b of buttons){const id=b.dataset.ingredient;b.disabled=!loaded||launching;b.setAttribute('aria-pressed',String(recipe[id]));b.setAttribute('aria-label',`${recipe[id]?'Remove':'Add'} ${names[id].toLowerCase()}`);b.querySelector('.ingredient-state').textContent=recipe[id]?'Selected':'Add';}
 for(const b of layouts){b.disabled=!loaded||launching;b.textContent=separated?'Stack layers':'Separate layers';b.setAttribute('aria-pressed',String(separated));}
 for(const b of resets)b.disabled=!loaded||launching;
 const count=dish.options.filter(o=>recipe[o.id]).length;
 const summary=`${count} of ${dish.options.length} options · ${separated?'layers separated':'stacked'}. ${dish.baseNote}`;
 document.querySelector('#recipe-status').textContent=summary;
 document.querySelector('#ar-recipe-status').textContent=summary;onChange({...recipe},separated);
 launch.disabled=!ready||!viewer.canActivateAR||launching||presenting;
 nativeAR.disabled=launch.disabled;
 launch.textContent=failed?'Model unavailable':!loaded?'Loading your dish…':isIOS&&!iosReady?(iosError?'AR file unavailable':'Preparing your AR recipe…'):launching?'Opening AR…':viewer.canActivateAR?'View on My Table  ↗':'AR unavailable on this device';
 viewer.classList.toggle('is-loading',!loaded);
 phoneNote.hidden=!loaded||viewer.canActivateAR;
 document.querySelector('#reset-view').disabled=!loaded;
 if(iosReady&&!launching&&!presenting){iosFallback.href=`${blobUrl}#allowsContentScaling=0`;iosFallback.removeAttribute('aria-disabled');}
 else{iosFallback.removeAttribute('href');iosFallback.setAttribute('aria-disabled','true');}
 document.querySelector('#retry-ios').hidden=!iosError;
 viewer.alt=`Custom ${dish.presentation.short} with ${dish.options.filter(o=>recipe[o.id]).map(o=>o.label).join(', ')||'all ingredients removed'}. ${separated?'Layers separated.':'Stacked.'} Drag to rotate.`;
}
function applyIngredients(){
 for(const id of ids){
  const option=dish.options.find(o=>o.id===id), mappings=option?.model.materials??[id];
  for(const name of mappings){const material=viewer.model.materials.find(m=>m.name===name);if(!material)throw new Error(`Ingredient mapping missing: ${name}`);material.pbrMetallicRoughness.setBaseColorFactor([1,1,1,recipe[id]?1:0]);}
 }
}
let poseRevision=0;
async function selectRecipePose(){
 const revision=++poseRevision;
 const time=Math.max(0,Math.min(1,viewer.currentTime||0));
 const mask=ids.reduce((mask,id,i)=>mask|(recipe[id]?(1<<i):0),0);
 viewer.animationCrossfadeDuration=0;
 viewer.animationName=`Recipe_${mask}`;
 // model-viewer applies animation-name during its reactive update.
 await viewer.updateComplete;
 if(revision!==poseRevision)return false;
 viewer.timeScale=1;viewer.play({repetitions:1});viewer.pause();viewer.currentTime=time;
 return true;
}
async function refreshRecipePose(){
 clearTimeout(animationTimer);
 try{if(await selectRecipePose()){applyIngredients();moveLayers();}}catch(error){showError(error);}
}
function finishMotion(){
 viewer.pause();viewer.currentTime=separated?1:0;animating=false;applyIngredients();
}
function frameDish(){viewer.cameraOrbit=separated?dish.presentation.separatedOrbit:dish.presentation.orbit;viewer.cameraTarget=separated?dish.presentation.separatedTarget:dish.presentation.target;}
function moveLayers(){
 frameDish();
 clearTimeout(animationTimer);
 const target=separated?1:0,from=Math.max(0,Math.min(1,viewer.currentTime||0));
 if(reducedMotion||Math.abs(target-from)<.01){finishMotion();return;}
 animating=true;
 const start=performance.now();
 // Seek a paused action at unit speed. Repeated play/reverse calls in this
 // library version can clamp the action and reset it during rapid choices.
 // Timers update the pose; model-viewer's own renderer draws it in WebXR.
 const step=()=>{
  const progress=Math.min(1,(performance.now()-start)/550);
  const eased=progress*progress*(3-2*progress);
  viewer.currentTime=from+(target-from)*eased;
  if(progress<1)animationTimer=setTimeout(step,16);else finishMotion();
 };
 step();
}
function queuePackage(){
 iosReady=false;iosError=false;clearTimeout(packageTimer);render();
 if(!packageEntries)return;
 packageTimer=setTimeout(()=>{
  try{
   const bytes=makeRecipePackage(packageEntries,Object.fromEntries(dish.options.map(o=>[o.model.usdVariant,recipe[o.id]])),separated);
   const next=URL.createObjectURL(new Blob([bytes],{type:'model/vnd.usdz+zip'}));
   viewer.setAttribute('ios-src',next);
   const previous=blobUrl;blobUrl=next;iosReady=true;if(previous)URL.revokeObjectURL(previous);
  }catch(error){iosError=true;console.error(error);}
  render();
 },100);
}
async function loadPackage(){
 iosError=false;render();
 try{const response=await fetch(dish.assets.usdz);if(!response.ok)throw new Error('AR download failed');packageEntries=readStoredZip(await response.arrayBuffer());queuePackage();}
 catch(error){iosError=true;status.textContent='The iPhone AR file could not load. You can still customize in 3D; use Retry iPhone AR below.';render();}
}
function choose(id){
 if(!loaded||launching)return;
 const option=dish.options.find(o=>o.id===id);
 if(!recipe[id]&&option.requires.some(n=>!recipe[n])){status.textContent='Add the required ingredient first.';return;}
 recipe[id]=!recipe[id];
 for(const o of dish.options)if(recipe[o.id]&&o.requires.some(n=>!recipe[n]))recipe[o.id]=false;
 // Keep the chosen layout; stacked recipes close gaps after every edit.
 applyIngredients();saveSelection();refreshRecipePose();queuePackage();
}
for(const b of buttons)b.addEventListener('click',()=>choose(b.dataset.ingredient));
for(const b of layouts)b.addEventListener('click',()=>{if(!loaded||launching)return;separated=!separated;saveSelection();moveLayers();queuePackage();});
for(const b of resets)b.addEventListener('click',()=>{if(!loaded||launching)return;for(const id of ids)recipe[id]=defaults[id];separated=false;applyIngredients();saveSelection();refreshRecipePose();queuePackage();});
document.querySelector('#ar-customizer').addEventListener('beforexrselect',event=>event.preventDefault());
viewer.addEventListener('load',async()=>{
 try{if(!await selectRecipePose())return;viewer.currentTime=separated?1:0;applyIngredients();loaded=true;failed=false;loading.hidden=true;retry.hidden=true;render();status.textContent='Stacked layers close up when you remove ingredients. Use Separate layers to inspect your choices.';}
 catch(error){showError(error);console.error(error);}
});
function showError(error){loaded=false;failed=true;loading.hidden=false;loading.textContent=error?.message?.includes('mapping')?'This dish’s ingredient controls need attention. Please choose another dish.':'We couldn’t load the 3D model. Check your connection and try again.';retry.hidden=false;status.textContent=loading.textContent;render();}
viewer.addEventListener('error',showError);
viewer.addEventListener('ar-status',event=>{
 const state=event.detail.status;presenting=state==='session-started'||state==='object-placed';
 if(presenting||state==='failed'||state==='not-presenting')launching=false;
 if(state==='failed')status.textContent='AR could not start. Check camera permission in your browser settings, or keep exploring in 3D.';
 render();
});
launch.addEventListener('click',async()=>{
 if(launch.disabled)return;launching=true;render();
 try{await viewer.activateAR();}catch{status.textContent='AR could not start. Allow camera access in browser settings and try again. You can still use the 3D preview.';}finally{launching=false;render();}
});
document.querySelector('#reset-view').addEventListener('click',()=>{frameDish();viewer.fieldOfView='auto';});
retry.addEventListener('click',()=>location.reload());
document.querySelector('#retry-ios').addEventListener('click',loadPackage);
document.addEventListener('visibilitychange',()=>{if(!document.hidden){launching=false;if(animating)finishMotion();render();if(isIOS)document.querySelector('#native-return-note').hidden=false;}});
frameDish();viewer.src=dish.assets.glb;
render();loadPackage();
setTimeout(()=>{if(!loaded&&!failed){status.textContent='Still loading. Check your connection or try again.';retry.hidden=false;}},20000);
}
