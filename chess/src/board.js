import * as T from 'three';
const palette={w:0xb52e43,b:0x3264af};
export const location=s=>new T.Vector3(s.charCodeAt(0)-100.5,.13,4.5-Number(s[1]));
export class Board {
  constructor(container,onSquare){
    this.container=container;this.onSquare=onSquare;this.pieces=new Map();this.tiles=[];this.animations=[];this.angle=0;this.targetAngle=0;this.reduced=false;
    this.scene=new T.Scene();this.scene.background=new T.Color('#e9e5dc');
    this.camera=new T.PerspectiveCamera(36,1,.1,80);
    this.renderer=new T.WebGLRenderer({antialias:true,alpha:false});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFShadowMap;this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1;this.renderer.setClearColor(0xe9e5dc);container.append(this.renderer.domElement);
    this.scene.add(new T.HemisphereLight(0xffffff,0x8b8580,2.5));
    const sun=new T.DirectionalLight(0xfff4e6,3.4);sun.position.set(-5,12,7);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-7,right:7,top:7,bottom:-7});sun.shadow.bias=-.001;this.scene.add(sun);
    const fill=new T.DirectionalLight(0xb6d7ff,1.4);fill.position.set(5,5,-8);this.scene.add(fill);
    const floor=this.box(35,.15,35,0xd6d1c8,0,-.6,0);floor.receiveShadow=true;this.scene.add(floor);
    this.scene.add(this.box(9,.5,9,0x17232c,0,-.18,0));this.scene.add(this.box(8.72,.05,8.72,0xb7a27a,0,.09,0));
    for(let r=1;r<=8;r++)for(let f=0;f<8;f++){const s=String.fromCharCode(97+f)+r;const color=(f+r)%2===0?0xf1ebde:0x59646a;const tile=this.box(.99,.06,.99,color,f-3.5,.13,4.5-r);tile.userData={square:s,color};tile.receiveShadow=true;this.tiles.push(tile);this.scene.add(tile);}
    this.labels();this.ray=new T.Raycaster();this.pointer=new T.Vector2();
    this.renderer.domElement.setAttribute('aria-label','Interactive 3D chessboard. Use the 2D board for keyboard play.');
    this.renderer.domElement.addEventListener('pointerup',e=>{const rect=this.renderer.domElement.getBoundingClientRect();this.pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);this.ray.setFromCamera(this.pointer,this.camera);const hits=this.ray.intersectObjects([...this.pieces.values(),...this.tiles],true);if(hits.length){let o=hits[0].object;while(o&&!o.userData.square)o=o.parent;if(o)this.onSquare(o.userData.square);}});
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(container);this.resize();
    this.renderer.setAnimationLoop(t=>this.frame(t));
  }
  box(w,h,d,color,x=0,y=0,z=0){const m=new T.Mesh(new T.BoxGeometry(w,h,d),new T.MeshStandardMaterial({color,roughness:.62,metalness:.12}));m.position.set(x,y,z);m.castShadow=true;return m;}
  labels(){
    for(let i=0;i<8;i++)for(const side of [0,1]){const text=side?String(8-i):String.fromCharCode(97+i);const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64;const ctx=canvas.getContext('2d');ctx.fillStyle='#f2e7ca';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='36px sans-serif';ctx.fillText(text,32,32);const map=new T.CanvasTexture(canvas);const mesh=new T.Mesh(new T.PlaneGeometry(.25,.25),new T.MeshBasicMaterial({map,transparent:true,depthWrite:false}));mesh.rotation.x=-Math.PI/2;mesh.position.set(side?-4.27:i-3.5,.12,side?i-3.5:4.27);this.scene.add(mesh);}
  }
  model(piece){
    const g=new T.Group(), color=palette[piece.color], mat=new T.MeshStandardMaterial({color,roughness:.38,metalness:.24});
    const add=(geo,x,y,z,material=mat)=>{const m=new T.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;};
    const cyl=(a,b,h,x,y,z)=>add(new T.CylinderGeometry(a,b,h,24),x,y,z);
    const box=(w,h,d,x,y,z)=>add(new T.BoxGeometry(w,h,d),x,y,z);
    const sphere=(r,x,y,z)=>add(new T.SphereGeometry(r,16,12),x,y,z);
    cyl(.34,.37,.12,0,.11,0);cyl(.31,.34,.07,0,.20,0);
    const accent=new T.MeshStandardMaterial({color:piece.color==='w'?0xf9b2a8:0xa8d3f5,roughness:.6,metalness:.3});
    if(piece.type==='r'){
      box(.58,.57,.52,0,.53,0);box(.68,.10,.62,0,.88,0);
      const glass=new T.MeshStandardMaterial({color:piece.color==='w'?0x512733:0x1b3452,roughness:.25,metalness:.55});
      for(const x of [-.18,0,.18])add(new T.BoxGeometry(.14,.37,.015),x,.53,.267,glass);
      box(.64,.06,.025,0,.43,.28);box(.10,.72,.11,-.28,.61,-.2);
    }else {
      const heights={p:.70,n:.91,b:1.10,q:1.30,k:1.48},h=heights[piece.type];
      cyl(.16,.23,h*.44,0,.28+h*.22,0); // tailored torso
      cyl(.10,.13,.14,0,.27+h*.50,0);
      sphere(piece.type==='p'?.135:.15,0,.32+h*.60,0);
      const arm=(x,angle)=>{const a=cyl(.055,.07,h*.32,x,.29+h*.28,.025);a.rotation.z=angle;};arm(-.20,-.22);arm(.20,.22);
      // Lapels and tie make the staff recognizable at gameplay size.
      if(piece.type!=='n'){add(new T.ConeGeometry(.035,.20,4),0,.33+h*.28,.16,accent).rotation.z=Math.PI;}
      if(piece.type==='p'){box(.065,.05,.025,.085,.57,.185);}
      if(piece.type==='b'||piece.type==='q'){const folder=box(.24,.31,.055,.19,.55,.19);folder.rotation.z=-.16;add(new T.BoxGeometry(.16,.02,.008),.19,.62,.222,accent);}
      if(piece.type==='n'){
        box(.31,.05,.23,0,.95,.025);box(.34,.03,.10,0,.93,.14);
        const wrench=new T.Group();const handle=box(.055,.51,.055,.20,.58,.22);handle.rotation.z=-.28;
        const jaw=add(new T.TorusGeometry(.11,.035,8,16,Math.PI*1.45),.27,.84,.22,accent);jaw.rotation.z=.8;
      }
      if(piece.type==='k'){
        const arm=box(.08,.37,.08,.24,1.12,0);arm.rotation.z=-.35;sphere(.065,.31,1.30,0);
        add(new T.TorusGeometry(.07,.018,8,16),.36,1.25,.03,accent);add(new T.BoxGeometry(.035,.17,.025),.36,1.12,.03,accent);
        cyl(.13,.15,.07,0,1.27,0);
      }
      if(piece.type==='q')cyl(.13,.16,.12,0,1.18,0);
    }
    g.rotation.y=piece.color==='w'?0:Math.PI;g.userData={square:piece.square,type:piece.type};return g;
  }
  disposeGroup(g){g.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material)o.material.dispose();});}
  sync(chess){for(const p of this.pieces.values()){this.scene.remove(p);this.disposeGroup(p);}this.pieces.clear();for(const row of chess.board())for(const p of row)if(p){const model=this.model(p);model.position.copy(location(p.square));this.pieces.set(p.square,model);this.scene.add(model);}}
  highlight(selected,legal,last,checkSquare){for(const tile of this.tiles){const s=tile.userData.square;tile.material.color.setHex(s===checkSquare?0xdca451:s===selected?0xd8b978:legal.includes(s)?0x9fbca4:last?.includes(s)?0xb8b9a3:tile.userData.color);}}
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
  resize(){const w=this.container.clientWidth,h=this.container.clientHeight;if(!w||!h)return;this.camera.aspect=w/h;this.camera.zoom=w/h<1?1.15:1.4;this.camera.updateProjectionMatrix();this.renderer.setSize(w,h);}
  frame(t){
    if(document.hidden)return;
    this.angle=this.reduced?this.targetAngle:this.angle+(this.targetAngle-this.angle)*.1;
    const portrait=this.camera.aspect<1, radius=portrait?17.6:14.4;this.camera.position.set(Math.sin(this.angle)*radius,portrait?17.5:15,Math.cos(this.angle)*radius);this.camera.lookAt(0,0,0);
    this.animations=this.animations.filter(a=>{const p=Math.min(1,(t-a.start)/a.duration),ease=p*p*(3-2*p);for(const j of a.jobs){j.model.position.lerpVectors(j.from,j.to,ease);j.model.position.y+=Math.sin(p*Math.PI)*j.hop;}if(a.captured)a.captured.scale.setScalar(Math.max(.001,1-p));if(p===1){a.resolve();return false;}return true;});
    this.renderer.render(this.scene,this.camera);
  }
}
