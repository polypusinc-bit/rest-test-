import { readStoredZip, makeRecipePackage } from './recipe-package.js?v=layers-1';
import { DISHES } from './dishes.js?v=menu-1';
const requestedDish=new URL(location.href).searchParams.get('dish');
const dishId=Object.hasOwn(DISHES,requestedDish)?requestedDish:'pizza';
const dish=DISHES[dishId];
document.title=`${dish.title} in 3D · The Test Kitchen`;
document.querySelector('#dish-title').textContent=dish.title;
document.querySelector('#dish-description').textContent=dish.description;
document.querySelector('#dish-number').textContent=`The classics / ${dish.number}`;
document.querySelector('#dish-size').textContent=dish.size;
for(const el of document.querySelectorAll('[data-base-note]'))el.textContent=dish.base;
for(const el of document.querySelectorAll('[data-dish-short]'))el.textContent=`Build your ${dish.short}`;
for(const el of document.querySelectorAll('[data-dish-link]'))if(el.dataset.dishLink===dishId)el.setAttribute('aria-current','page');
for(const grid of document.querySelectorAll('[data-ingredient-grid]')){
 for(const [id,label] of dish.ingredients){
  const button=document.createElement('button');button.type='button';button.dataset.ingredient=id;button.disabled=true;
  const name=document.createElement('span');name.textContent=label;
  const state=document.createElement('span');state.className='ingredient-state';
  button.append(name,state);grid.append(button);
 }
}
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
const ids=dish.ingredients.map(([id])=>id);
const names=Object.fromEntries(dish.ingredients.map(([id,label])=>[id,label]));
const defaults=Object.fromEntries(dish.ingredients.map(([id,,included])=>[id,included]));
const query=new URL(location.href).searchParams;
const omitted=new Set((query.get('omit')||'').split(','));
const recipe=Object.fromEntries(ids.map(id=>[id,query.has('omit')?!omitted.has(id):defaults[id]]));
let separated=query.get('layers')==='apart';
let loaded=false,failed=false,presenting=false,launching=false,animating=false;
let iosReady=false,iosError=false,packageEntries=null,blobUrl=null;
let animationTimer,packageTimer;
const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(/Mac/.test(navigator.userAgent)&&navigator.maxTouchPoints>1);
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
function saveSelection(){
 const url=new URL(location.href);url.searchParams.set('dish',dishId);
 const off=ids.filter(id=>!recipe[id]);
 url.searchParams.set('omit',off.join(',')); // Empty explicitly means every ingredient is included.
 if(separated)url.searchParams.set('layers','apart');else url.searchParams.delete('layers');
 history.replaceState(null,'',url);
}
function render(){
 const ready=loaded&&(!isIOS||iosReady);
 for(const b of buttons){const id=b.dataset.ingredient;b.disabled=!loaded||launching;b.setAttribute('aria-pressed',String(recipe[id]));b.setAttribute('aria-label',`${recipe[id]?'Remove':'Add'} ${names[id].toLowerCase()}`);b.querySelector('.ingredient-state').textContent=recipe[id]?'Included':'Removed';}
 for(const b of layouts){b.disabled=!loaded||launching;b.textContent=separated?'Stack layers':'Separate layers';b.setAttribute('aria-pressed',String(separated));}
 for(const b of resets)b.disabled=!loaded||launching;
 const count=ids.filter(id=>recipe[id]).length;
 const summary=`${count} of ${ids.length} ingredients · ${separated?'layers separated':'stacked'}. ${dish.base}`;
 document.querySelector('#recipe-status').textContent=summary;
 document.querySelector('#ar-recipe-status').textContent=summary;
 launch.disabled=!ready||!viewer.canActivateAR||launching||presenting;
 nativeAR.disabled=launch.disabled;
 launch.textContent=failed?'Model unavailable':!loaded?'Loading your dish…':isIOS&&!iosReady?(iosError?'AR file unavailable':'Preparing your AR recipe…'):launching?'Opening AR…':viewer.canActivateAR?'View on your table  ↗':'AR requires a compatible phone';
 viewer.classList.toggle('is-loading',!loaded);
 phoneNote.hidden=!loaded||viewer.canActivateAR;
 document.querySelector('#reset-view').disabled=!loaded;
 if(iosReady&&!launching&&!presenting){iosFallback.href=`${blobUrl}#allowsContentScaling=0`;iosFallback.removeAttribute('aria-disabled');}
 else{iosFallback.removeAttribute('href');iosFallback.setAttribute('aria-disabled','true');}
 document.querySelector('#retry-ios').hidden=!iosError;
 viewer.alt=`Custom ${dish.short} with ${ids.filter(id=>recipe[id]).map(id=>names[id]).join(', ')||'all ingredients removed'}. ${separated?'Layers separated.':'Stacked.'} Drag to rotate.`;
}
function applyIngredients(){
 for(const id of ids){const material=viewer.model.materials.find(m=>m.name===id);if(!material)throw new Error(`Missing ${id} layer`);material.pbrMetallicRoughness.setBaseColorFactor([1,1,1,recipe[id]?1:0]);}
}
function finishMotion(){
 viewer.pause();viewer.currentTime=separated?1:0;animating=false;applyIngredients();
}
function frameDish(){viewer.cameraOrbit=separated?dish.separatedOrbit:dish.orbit;viewer.cameraTarget=separated?dish.separatedTarget:dish.target;}
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
   const bytes=makeRecipePackage(packageEntries,recipe,separated);
   const next=URL.createObjectURL(new Blob([bytes],{type:'model/vnd.usdz+zip'}));
   viewer.setAttribute('ios-src',next);
   const previous=blobUrl;blobUrl=next;iosReady=true;if(previous)URL.revokeObjectURL(previous);
  }catch(error){iosError=true;console.error(error);}
  render();
 },100);
}
async function loadPackage(){
 iosError=false;render();
 try{const response=await fetch(dish.usdz);if(!response.ok)throw new Error('AR download failed');packageEntries=readStoredZip(await response.arrayBuffer());queuePackage();}
 catch(error){iosError=true;status.textContent='The iPhone AR file could not load. You can still customize in 3D; use Retry iPhone AR below.';render();}
}
function choose(id){
 if(!loaded||launching)return;
 recipe[id]=!recipe[id];
 // Lift before hiding a removed layer; restore added layers immediately.
 if(recipe[id])applyIngredients();
 separated=true;saveSelection();moveLayers();queuePackage();
}
for(const b of buttons)b.addEventListener('click',()=>choose(b.dataset.ingredient));
for(const b of layouts)b.addEventListener('click',()=>{if(!loaded||launching)return;separated=!separated;saveSelection();moveLayers();queuePackage();});
for(const b of resets)b.addEventListener('click',()=>{if(!loaded||launching)return;for(const id of ids)recipe[id]=defaults[id];separated=false;applyIngredients();saveSelection();moveLayers();queuePackage();});
document.querySelector('#ar-customizer').addEventListener('beforexrselect',event=>event.preventDefault());
viewer.addEventListener('load',()=>{
 try{viewer.timeScale=1;viewer.play({repetitions:1});viewer.pause();viewer.currentTime=separated?1:0;applyIngredients();loaded=true;failed=false;loading.hidden=true;retry.hidden=true;render();status.textContent='Choose ingredients to lift the layers apart. Stack them again whenever you’re ready.';}
 catch(error){showError();console.error(error);}
});
function showError(){loaded=false;failed=true;loading.hidden=true;retry.hidden=false;status.textContent='The dish could not load. Check your connection and try again.';render();}
viewer.addEventListener('error',showError);
viewer.addEventListener('ar-status',event=>{
 const state=event.detail.status;presenting=state==='session-started'||state==='object-placed';
 if(presenting||state==='failed'||state==='not-presenting')launching=false;
 if(state==='failed')status.textContent='AR could not start. Open “AR didn’t open?” for help.';
 render();
});
launch.addEventListener('click',async()=>{
 if(launch.disabled)return;launching=true;render();
 try{await viewer.activateAR();}catch{status.textContent='AR could not start. Try Safari on iPhone or Chrome on a supported Android phone.';}finally{launching=false;render();}
});
document.querySelector('#reset-view').addEventListener('click',()=>{frameDish();viewer.fieldOfView='auto';});
retry.addEventListener('click',()=>location.reload());
document.querySelector('#retry-ios').addEventListener('click',loadPackage);
document.addEventListener('visibilitychange',()=>{if(!document.hidden){launching=false;if(animating)finishMotion();render();}});
frameDish();viewer.src=dish.glb;
render();loadPackage();
setTimeout(()=>{if(!loaded&&!failed){status.textContent='Still loading your dish. Check your connection or try again.';retry.hidden=false;}},20000);
