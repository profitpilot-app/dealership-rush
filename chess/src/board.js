import * as T from 'three';
import {batchGroup} from './mesh-utils.js';
import {figurine} from './figures.js';
import {showroom,woodMaterial,stoneMaterial} from './showroom.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
export const location=s=>new T.Vector3(s.charCodeAt(0)-100.5,.13,4.5-Number(s[1]));
export class Board {
  constructor(container,onSquare){
    this.container=container;this.onSquare=onSquare;this.pieces=new Map();this.tiles=[];this.animations=[];this.angle=0;this.targetAngle=0;this.reduced=false;
    this.scene=new T.Scene();this.scene.background=new T.Color('#172129');
    this.camera=new T.OrthographicCamera(-6,6,6,-6,.1,80);
    this.renderer=new T.WebGLRenderer({antialias:true,alpha:false});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFShadowMap;this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1;this.renderer.setClearColor(0x172129);container.append(this.renderer.domElement);
    const environment=new RoomEnvironment();const pmrem=new T.PMREMGenerator(this.renderer);this.environmentTarget=pmrem.fromScene(environment,.06);this.scene.environment=this.environmentTarget.texture;this.scene.environmentIntensity=.38;environment.dispose();pmrem.dispose();
    this.scene.add(new T.HemisphereLight(0xcbddeb,0x443425,.8));
    const sun=new T.DirectionalLight(0xffdb9e,4.1);sun.position.set(-3,9,5);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-7,right:7,top:7,bottom:-7});sun.shadow.bias=-.001;this.scene.add(sun);
    const fill=new T.DirectionalLight(0xaecfff,1.5);fill.position.set(5,5,-8);this.scene.add(fill);
    this.scene.add(batchGroup(showroom()));
    const tabletop=this.box(10.8,.36,10.2,0x30251c,0,-.58,0);tabletop.material=woodMaterial();this.scene.add(tabletop);for(const x of [-4.8,4.8])for(const z of [-4.4,4.4])this.scene.add(this.box(.16,2.6,.16,0x25292a,x,-2,z));
    const boardBase=this.box(9,.42,9,0x352517,0,-.15,0);boardBase.material=woodMaterial();this.scene.add(boardBase);this.scene.add(this.box(8.72,.05,8.72,0xb7a27a,0,.09,0));
    for(let r=1;r<=8;r++)for(let f=0;f<8;f++){const s=String.fromCharCode(97+f)+r;const color=(f+r)%2===0?0xe7dcc3:0x24363b;const tile=this.box(.99,.06,.99,color,f-3.5,.13,4.5-r);tile.material=stoneMaterial(color);tile.userData={square:s,color};tile.receiveShadow=true;this.tiles.push(tile);this.scene.add(tile);}
    this.labels();this.ray=new T.Raycaster();this.pointer=new T.Vector2();
    this.renderer.domElement.setAttribute('aria-label','Interactive 3D chessboard. Use the 2D board for keyboard play.');
    this.renderer.domElement.addEventListener('pointerup',e=>{const rect=this.renderer.domElement.getBoundingClientRect();this.pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);this.ray.setFromCamera(this.pointer,this.camera);const tileHit=this.ray.intersectObjects(this.tiles,false)[0];if(tileHit&&this.legalTargets?.has(tileHit.object.userData.square)){this.onSquare(tileHit.object.userData.square);return;}const hits=this.ray.intersectObjects([...this.pieces.values(),...this.tiles],true);if(hits.length){let o=hits[0].object;while(o&&!o.userData.square)o=o.parent;if(o)this.onSquare(o.userData.square);}});
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(container);this.resize();
    this.renderer.setAnimationLoop(t=>this.frame(t));
  }
  box(w,h,d,color,x=0,y=0,z=0){const m=new T.Mesh(new T.BoxGeometry(w,h,d),new T.MeshStandardMaterial({color,roughness:.62,metalness:.12}));m.position.set(x,y,z);m.castShadow=true;return m;}
  labels(){
    for(let i=0;i<8;i++)for(const side of [0,1]){const text=side?String(8-i):String.fromCharCode(97+i);const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64;const ctx=canvas.getContext('2d');ctx.fillStyle='#f2e7ca';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='36px sans-serif';ctx.fillText(text,32,32);const map=new T.CanvasTexture(canvas);const mesh=new T.Mesh(new T.PlaneGeometry(.25,.25),new T.MeshBasicMaterial({map,transparent:true,depthWrite:false}));mesh.rotation.x=-Math.PI/2;mesh.position.set(side?-4.27:i-3.5,.12,side?i-3.5:4.27);this.scene.add(mesh);}
  }
  model(piece){return figurine(piece);}
  disposeGroup(g){g.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material)o.material.dispose();});}
  sync(chess){for(const p of this.pieces.values()){this.scene.remove(p);this.disposeGroup(p);}this.pieces.clear();for(const row of chess.board())for(const p of row)if(p){const model=this.model(p);model.position.copy(location(p.square));this.pieces.set(p.square,model);this.scene.add(model);}}
  highlight(selected,legal,last,checkSquare){this.legalTargets=new Set(legal);for(const tile of this.tiles){const s=tile.userData.square;tile.material.color.setHex(s===checkSquare?0xdca451:s===selected?0xd8b978:legal.includes(s)?0x9fbca4:last?.includes(s)?0xb8b9a3:tile.userData.color);}}
  animate(move){
    if(this.reduced)return Promise.resolve();
    const moving=this.pieces.get(move.from);if(!moving)return Promise.resolve();
    const capturedSquare=move.flags.includes('e')?move.to[0]+move.from[1]:move.to;
    const captured=this.pieces.get(capturedSquare);
    const jobs=[{model:moving,from:location(move.from),to:location(move.to),hop:move.piece==='n'?.8:.10}];
    if(move.flags.includes('k')||move.flags.includes('q')){const rank=move.from[1],from=(move.flags.includes('k')?'h':'a')+rank,to=(move.flags.includes('k')?'f':'d')+rank;const rook=this.pieces.get(from);if(rook)jobs.push({model:rook,from:location(from),to:location(to),hop:.1});}
    return new Promise(resolve=>this.animations.push({start:performance.now(),duration:move.piece==='n'?420:320,jobs,captured,resolve}));
  }
  flip(){this.targetAngle+=Math.PI;}
  resize(){const w=this.container.clientWidth,h=this.container.clientHeight;if(!w||!h)return;this.camera.aspect=w/h;const span=Math.max(10.8,11.8/this.camera.aspect);this.camera.zoom=1.22;this.camera.left=-span*this.camera.aspect/2;this.camera.right=span*this.camera.aspect/2;this.camera.top=span/2;this.camera.bottom=-span/2;this.camera.updateProjectionMatrix();this.renderer.setSize(w,h);}
  frame(t){
    if(document.hidden)return;
    this.angle=this.reduced?this.targetAngle:this.angle+(this.targetAngle-this.angle)*.1;
    const radius=14;this.camera.position.set(Math.sin(this.angle)*radius,18,Math.cos(this.angle)*radius);this.camera.lookAt(0,0,0);
    this.animations=this.animations.filter(a=>{const p=Math.min(1,(t-a.start)/a.duration),ease=p*p*(3-2*p);for(const j of a.jobs){j.model.position.lerpVectors(j.from,j.to,ease);j.model.position.y+=Math.sin(p*Math.PI)*j.hop;}if(a.captured)a.captured.scale.setScalar(Math.max(.001,1-p));if(p===1){a.resolve();return false;}return true;});
    this.renderer.render(this.scene,this.camera);
  }
}
