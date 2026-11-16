import {createGestureController} from './ingredient-interaction.js?v=6';
import {createPickingAdapter} from './picking-adapter.js?v=6';
export function attachIngredientEditor({viewer,dish,getRecipe,remove,undo,canUndo,isReady}){
 const root=viewer.querySelector('.interaction-ui'),surface=root.querySelector('.pick-surface'),bin=root.querySelector('.trash-target'),ghost=root.querySelector('.drag-ghost'),label=root.querySelector('.selection-label'),message=root.querySelector('.edit-message');
 const modes=[...root.querySelectorAll('[data-edit-mode]')];
 const adapter=createPickingAdapter(viewer,dish);
 let pickingFailed=false,editing=false,ar=false,placed=false,tracking=true,highlight=[],hintShown=false;
 function restore(){for(const [m,color] of highlight)m.setEmissiveFactor(color);highlight=[];}
 function setHighlight(option){restore();if(!option)return;for(const m of viewer.model.materials)if(option.model.materials.includes(m.name)){highlight.push([m,[...m.emissiveFactor]]);m.setEmissiveFactor([.22,.075,.012]);}}
 const allowed=()=>adapter.supported&&!pickingFailed&&editing&&isReady()&&(!ar||(placed&&tracking));
 const gestures=createGestureController({dish,getRecipe,canEdit:allowed,pick:(x,y)=>{try{return adapter.pick(x,y,{ar,rect:surface.getBoundingClientRect()});}catch{pickingFailed=true;editing=false;update();return null;}},remove,onUpdate:state=>{
  setHighlight(state.selected);const p=state.pointer;
  label.textContent=state.selected?`${state.selected.label} selected${dish.id==='pizza'?' · whole ingredient group':''}`:'';
  bin.disabled=!state.selected||!allowed();bin.setAttribute('aria-label',state.selected?`Remove selected ${state.selected.label}`:'Select an ingredient to remove');
  root.classList.toggle('dragging',!!p?.dragging);bin.classList.toggle('over-bin',!!p?.over);
  bin.querySelector('span').textContent=p?.over?'Release to remove':'Remove';
  ghost.hidden=!p?.dragging;
  if(p?.dragging){ghost.textContent=state.selected.label;const bounds=root.getBoundingClientRect();ghost.style.left=`${Math.max(8,Math.min(bounds.width-145,p.x-bounds.left-65))}px`;ghost.style.top=`${Math.max(64,p.y-bounds.top-70)}px`;}
 }});
 function update(){
  root.classList.toggle('editing',editing&&adapter.supported);root.classList.toggle('in-ar',ar);
  surface.hidden=!allowed();bin.hidden=!allowed();label.hidden=!allowed();
  for(const b of modes){b.disabled=!adapter.supported||pickingFailed||!isReady()||(ar&&(!placed||!tracking));b.setAttribute('aria-pressed',String(editing));b.textContent=editing?(ar?'Reposition dish':'Rotate dish'):'Edit ingredients';}
  root.querySelector('[data-undo]').disabled=!canUndo()||!isReady()||(ar&&(!placed||!tracking));
  viewer.cameraControls=!editing;
  message.textContent=ar&&!tracking?'Tracking paused. Move your phone slowly.':ar&&!placed?'Move your phone slowly to find a table.':(!adapter.supported||pickingFailed)?'Use the ingredient buttons below to customize.':ar&&!editing?'Move the dish, then choose Edit ingredients.':editing&&!hintShown?'Tap an ingredient, then drag it to the bin.':editing?'Spread ingredients to reach hidden layers.':'';
 }
 for(const b of modes)b.addEventListener('click',()=>{gestures.cancel();editing=!editing;update();if(editing)hintShown=true;});
 root.querySelector('[data-edit-help]').addEventListener('click',()=>{message.textContent=editing&&adapter.supported?'Tap an ingredient, then drag it to the bin. Or tap the bin after selecting. Spread layers to reach hidden ingredients.':'Choose Edit ingredients to select food. Use the ingredient tray to add items back.';});
 root.querySelector('[data-undo]').addEventListener('click',()=>{gestures.cancel();undo();});
 bin.addEventListener('click',()=>gestures.trash());
 const binRect=()=>bin.getBoundingClientRect();
 surface.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();if(gestures.down(e.pointerId,e.clientX,e.clientY))surface.setPointerCapture(e.pointerId);});
 surface.addEventListener('pointermove',e=>gestures.move(e.pointerId,e.clientX,e.clientY,binRect()));
 surface.addEventListener('pointerup',e=>gestures.up(e.pointerId,e.clientX,e.clientY,binRect()));
 surface.addEventListener('pointercancel',()=>gestures.cancel());
 // lost capture after a normal pointerup must retain tap selection.
 surface.addEventListener('lostpointercapture',()=>{if(root.classList.contains('dragging'))gestures.cancel();});
 root.addEventListener('beforexrselect',e=>{if(e.target!==root)e.preventDefault();});
 viewer.addEventListener('ar-status',e=>{const s=e.detail.status;ar=s==='session-started'||s==='object-placed';placed=s==='object-placed';tracking=true;editing=placed;gestures.cancel();update();if(editing)hintShown=true;});
 viewer.addEventListener('ar-tracking',e=>{tracking=e.detail.status==='tracking';gestures.cancel();update();});
 const interrupt=()=>{gestures.cancel();};
 window.addEventListener('resize',interrupt);root.querySelector('.ingredient-tray').addEventListener('toggle',interrupt);viewer.querySelector('.exit-ar').addEventListener('beforexrselect',e=>e.preventDefault());window.addEventListener('pagehide',interrupt);window.addEventListener('blur',interrupt);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)interrupt();});
 update();
 return {changed(feedback=''){gestures.changed();update();if(feedback)message.textContent=feedback;},cancel:interrupt};
}
