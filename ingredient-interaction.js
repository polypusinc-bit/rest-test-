// Gesture state only: all recipe mutations go through the existing viewer commit path.
export function ingredientForHit(dish, recipe, hit){
 if(!hit || hit.visible===false || hit.opacity===0)return null;
 const material=typeof hit==='string'?hit:hit.material;
 if(dish.fixedGeometry.includes(material)||dish.fixedGeometry.includes(hit.object)||Object.hasOwn(dish.fixed,material))return null;
 const matches=dish.options.filter(o=>recipe[o.id]===true&&!Object.hasOwn(dish.fixed,o.id)&&!dish.fixedGeometry.includes(o.id)&&(o.model.materials.includes(material)||(hit.object&&o.model.objects?.includes(hit.object))));
 return matches.length===1?matches[0]:null;
}
export function insideBin(x,y,rect){return x>=rect.left&&x<=rect.right&&y>=rect.top&&y<=rect.bottom;}
export function createGestureController({dish,getRecipe,canEdit,pick,remove,onUpdate,threshold=8}){
 let selected=null,pointer=null;
 const emit=()=>onUpdate({selected,pointer:pointer?{...pointer}:null});
 const clear=()=>{pointer=null;selected=null;emit();};
 return {
  get selected(){return selected;},
  down(id,x,y){
   if(!canEdit())return false;
   if(pointer){clear();return false;}
   selected=ingredientForHit(dish,getRecipe(),pick(x,y));
   pointer=selected?{id,x,y,startX:x,startY:y,dragging:false,over:false}:null;emit();return !!selected;
  },
  move(id,x,y,rect){if(!pointer||pointer.id!==id)return;if(!canEdit()){clear();return;}pointer.x=x;pointer.y=y;pointer.dragging ||= Math.hypot(x-pointer.startX,y-pointer.startY)>=threshold;pointer.over=pointer.dragging&&insideBin(x,y,rect);emit();},
  up(id,x,y,rect){if(!pointer||pointer.id!==id)return;const commit=canEdit()&&pointer.dragging&&insideBin(x,y,rect);const option=selected,wasDragging=pointer.dragging;pointer=null;if(wasDragging)selected=null;if(commit){selected=null;remove(option.id);}emit();},
  trash(){if(canEdit()&&selected&&getRecipe()[selected.id]){const id=selected.id;clear();remove(id);}},
  cancel:clear,
  changed:clear
 };
}
