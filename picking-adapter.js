// Isolated compatibility bridge for pinned model-viewer 4.1.0.
// Public materialFromPoint uses the active XR camera, but v4.1.0 raycasting
// does not exclude transparent meshes and divides XR coordinates by screen size.
// Read-only scene discovery + temporary noHit flags; never change geometry/poses.
export function createPickingAdapter(viewer,dish){
 const key=Object.getOwnPropertySymbols(viewer).find(s=>s.description==='scene');
 const scene=key&&viewer[key];
 const supported=!!scene?.model?.traverse&&typeof viewer.materialFromPoint==='function';
 return {
  supported,
  pick(x,y,{ar=false,rect}={}){
   if(!supported||ar&&!scene.xrCamera)return null;
   const changes=[];
   try{
    scene.model.updateMatrixWorld(true);
    scene.model.traverse(mesh=>{
     if(!mesh.isMesh)return;
     const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];
     // Only exclude entirely invisible meshes. Never look through opaque structure.
     if(!mesh.visible||materials.every(m=>m.visible===false||m.opacity<=0.001)){
      changes.push([mesh,mesh.userData.noHit,Object.hasOwn(mesh.userData,'noHit')]);mesh.userData.noHit=true;
     }
    });
    if(ar){if(!rect?.width||!rect?.height)return null;x=(x-rect.left)/rect.width*screen.width;y=(y-rect.top)/rect.height*screen.height;}
    const material=viewer.materialFromPoint(x,y);
    return material?{material:material.name,opacity:material.pbrMetallicRoughness.baseColorFactor[3]}:null;
   }finally{for(const [mesh,value,had] of changes){if(had)mesh.userData.noHit=value;else delete mesh.userData.noHit;}}
  }
 };
}
