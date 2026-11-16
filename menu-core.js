// Pure menu validation, pricing and state. No rendering or AR dependencies.
export const idPattern=/^[a-z][a-z0-9-]{0,63}$/;
const assetPattern=/^[A-Za-z0-9][A-Za-z0-9_.-]*\.(glb|usdz|png|webp|jpg|svg)$/;
export function validateMenu(data){
 const fail=message=>{throw new Error(message);};
 if(data?.schemaVersion!==1||!Array.isArray(data.restaurants)||!data.restaurants.length)fail('Invalid menu document');
 const rids=new Set(),slugs=new Set();
 for(const r of data.restaurants){
  if(!idPattern.test(r.id)||!idPattern.test(r.slug)||rids.has(r.id)||slugs.has(r.slug))fail('Invalid restaurant identifier');rids.add(r.id);slugs.add(r.slug);
  if(typeof r.name!=='string'||!r.name.trim()||r.name.length>100||typeof r.description!=='string'||r.description.length>1000)fail('Invalid restaurant text');
  if(!/^[A-Z]{3}$/.test(r.currency)||!assetPattern.test(r.logo)||!r.theme||Object.values(r.theme).some(v=>!/^#[0-9a-f]{6}$/i.test(v)))fail('Invalid restaurant theme');
  try{new Intl.NumberFormat('en-US',{style:'currency',currency:r.currency});}catch{fail('Invalid currency');}
  if(!Array.isArray(r.menuItems))fail('Missing dishes');const dishes=new Set();
  for(const d of r.menuItems){
   if(!idPattern.test(d.id)||dishes.has(d.id)||d.restaurantId!==r.id)fail('Invalid dish association');dishes.add(d.id);
   if(!d.name?.trim()||d.name.length>100||typeof d.description!=='string'||d.description.length>1500||typeof d.available!=='boolean')fail('Invalid dish');
   if(!Number.isSafeInteger(d.basePrice)||d.basePrice<0||d.basePrice>1000000)fail('Invalid base price');
   if(!assetPattern.test(d.thumbnail)||!assetPattern.test(d.assets?.glb)||!d.assets.glb.endsWith('.glb')||!assetPattern.test(d.assets?.usdz)||!d.assets.usdz.endsWith('.usdz'))fail('Invalid asset reference');
   if(!Array.isArray(d.recipeOrder)||new Set(d.recipeOrder).size!==d.recipeOrder.length||d.recipeOrder.length>12)fail('Invalid recipe order');
   const ids=new Set();if(!Array.isArray(d.options))fail('Missing options');
   for(const o of d.options){
    if(!/^[A-Za-z_]+$/.test(o.id)||ids.has(o.id)||!d.recipeOrder.includes(o.id))fail('Invalid ingredient identifier');ids.add(o.id);
    if(!o.label?.trim()||o.label.length>80||typeof o.default!=='boolean'||!['included','extra'].includes(o.kind)||o.selectionLimit!==1)fail('Invalid ingredient option');
    for(const price of [o.priceDelta,o.removalCredit])if(!Number.isSafeInteger(price)||price<0||price>1000000)fail('Invalid ingredient price');
    if(o.removalCredit>d.basePrice||!Array.isArray(o.requires)||o.requires.includes(o.id))fail('Invalid option constraints');
    if(!o.model||o.model.usdVariant!==o.id||!Array.isArray(o.model.materials)||!o.model.materials.length||o.model.materials.some(n=>!/^\w+$/.test(n)))fail('Missing ingredient mapping');
   }
   for(const o of d.options)if(o.requires.some(n=>!ids.has(n)&&d.fixed[n]!==true))fail('Unknown ingredient dependency');
   if(d.recipeOrder.some(n=>!ids.has(n)&&d.fixed[n]!==true)||Object.keys(d.fixed).some(n=>!d.recipeOrder.includes(n)||ids.has(n)))fail('Unmapped recipe channel');
   const p=d.presentation;if(!p||p.arScale!=='fixed'||p.placement!=='floor'||['orbit','target','separatedOrbit','separatedTarget'].some(n=>typeof p[n]!=='string'))fail('Invalid presentation');
  }
 }
 return data;
}
export function defaults(dish){return {...dish.fixed,...Object.fromEntries(dish.options.map(o=>[o.id,o.default]))};}
export function normalizeRecipe(dish,input={}){const result=defaults(dish);for(const o of dish.options)if(typeof input[o.id]==='boolean')result[o.id]=input[o.id];for(let pass=0;pass<dish.options.length;pass++){let changed=false;for(const o of dish.options)if(result[o.id]&&o.requires.some(n=>!result[n])){result[o.id]=false;changed=true;}if(!changed)break;}return result;}
export function priceCents(dish,input){const recipe=normalizeRecipe(dish,input);return Math.max(0,dish.basePrice+dish.options.reduce((sum,o)=>sum+(recipe[o.id]?o.priceDelta:-(o.default?o.removalCredit:0)),0));}
export function money(cents,currency){const format=new Intl.NumberFormat('en-US',{style:'currency',currency});return format.format(cents/10**format.resolvedOptions().maximumFractionDigits);}
export function menuURL(restaurant){return `menu.html?r=${encodeURIComponent(restaurant.slug)}`;}
export function dishURL(restaurant,dish){return `dish.html?r=${encodeURIComponent(restaurant.slug)}&dish=${encodeURIComponent(dish.id)}`;}
export function resolveRoute(data,url){const u=new URL(url),r=u.searchParams.get('r')??'test-kitchen';const restaurant=data.restaurants.find(x=>x.slug===r);if(!restaurant)return {error:'This restaurant link is not available.'};const menu=u.pathname.endsWith('/menu.html');if(menu)return {restaurant,screen:'menu'};const id=u.searchParams.get('dish')??(u.pathname.endsWith('/dish.html')?'pizza':'burger');const dish=restaurant.menuItems.find(x=>x.id===id);return dish?{restaurant,dish,screen:'dish'}:{restaurant,error:'This dish is not on the menu.'};}
export function stateKey(r,d){return `tk-recipe-v5:${r.id}:${d.id}`;}
export function loadSelection(r,d,url,storage){const u=new URL(url);let saved;try{saved=JSON.parse(storage.getItem(stateKey(r,d))||'null');}catch{}let recipe=normalizeRecipe(d,saved?.recipe),separated=saved?.separated===true;if(u.searchParams.has('omit')){const omitted=new Set(u.searchParams.get('omit').split(','));recipe=normalizeRecipe(d,Object.fromEntries(d.options.map(o=>[o.id,!omitted.has(o.id)])));}if(u.searchParams.get('cheese')==='off'&&d.id==='burger')recipe.Cheese=false;if(u.searchParams.has('layers'))separated=u.searchParams.get('layers')==='apart';return {recipe,separated};}
export function saveSelection(r,d,recipe,separated,storage){try{storage.setItem(stateKey(r,d),JSON.stringify({recipe:normalizeRecipe(d,recipe),separated}));}catch{}}
