import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
// Bake static submeshes by material so figures remain cheap enough to animate on mobile.
export function batchGroup(group){
 group.updateMatrixWorld(true);const batches=new Map();
 group.traverse(o=>{if(!o.isMesh)return;const geometry=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();geometry.applyMatrix4(o.matrixWorld);const key=o.material.uuid;if(!batches.has(key))batches.set(key,{material:o.material,geometries:[]});batches.get(key).geometries.push(geometry);});
 const result=new T.Group();
 for(const {material,geometries} of batches.values()){
  const merged=mergeGeometries(geometries,false);if(!merged)throw new Error('Cannot batch showroom geometry');
  const mesh=new T.Mesh(merged,material);mesh.castShadow=true;mesh.receiveShadow=true;result.add(mesh);for(const geometry of geometries)geometry.dispose();
 }
 group.traverse(o=>o.geometry?.dispose());return result;
}
