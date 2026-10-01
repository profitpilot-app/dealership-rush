import * as T from 'three';
const captions={p:'DEAL CLOSED',n:'QUICK REPAIR',b:'CREDIT DENIED',r:'MANAGER OVERRIDE',q:'SIGNED',k:'LOCKED'};
// Lightweight accents around the existing figure; no model swap or chess-state mutation.
export function captureEffect(type,position){
 const group=new T.Group();group.position.copy(position);
 const color=type==='b'?0xe95c66:0xe8c274;
 const ring=new T.Mesh(new T.RingGeometry(.28,.34,40),new T.MeshBasicMaterial({color,transparent:true,opacity:0,side:T.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.07;group.add(ring);
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=96;const ctx=canvas.getContext('2d');ctx.fillStyle=type==='b'?'#a92e3c':'#253a3b';ctx.fillRect(0,0,512,96);ctx.strokeStyle='#ecd5a0';ctx.lineWidth=5;ctx.strokeRect(3,3,506,90);ctx.fillStyle='#fff4d8';ctx.font='bold 36px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(captions[type],256,49);
 const texture=new T.CanvasTexture(canvas);const label=new T.Sprite(new T.SpriteMaterial({map:texture,transparent:true,opacity:0,depthTest:false}));label.scale.set(1.8,.34,1);label.position.y=1.5;group.add(label);
 const prop=new T.Group();const propMaterial=new T.MeshStandardMaterial({color:type==='r'?0x243d48:color,metalness:.55,roughness:.3,transparent:true});
 if(type==='r'){for(const [w,h,d,x] of [[.65,.10,.13,0],[.19,.18,.24,-.28],[.19,.18,.24,.28]]){const part=new T.Mesh(new T.BoxGeometry(w,h,d),propMaterial);part.position.x=x;prop.add(part);}}
 if(type==='q'){const curve=new T.CatmullRomCurve3([new T.Vector3(-.4,0,0),new T.Vector3(-.2,.12,0),new T.Vector3(-.1,-.08,0),new T.Vector3(.12,.12,0),new T.Vector3(.42,0,0)]);prop.add(new T.Mesh(new T.TubeGeometry(curve,24,.015,6,false),propMaterial));}
 group.add(prop);
 const sparks=[];const geo=new T.SphereGeometry(.025,5,4),mat=new T.MeshBasicMaterial({color,transparent:true,opacity:0});for(let i=0;i<12;i++){const spark=new T.Mesh(geo,mat);group.add(spark);sparks.push(spark);}
 return {group,update(p){const burst=Math.max(0,Math.min(1,(p-.42)/.58));const alpha=p<.42?0:Math.sin(burst*Math.PI);prop.visible=alpha>0;prop.position.y=type==='r'?.4+(1-burst)*1.6:.9;prop.rotation.y=burst*.3;propMaterial.opacity=alpha;ring.material.opacity=alpha*.8;ring.scale.setScalar(1+burst*2);label.material.opacity=alpha;label.position.y=1.6+(1-burst)*.3;mat.opacity=alpha;for(let i=0;i<sparks.length;i++){const a=i*Math.PI*2/sparks.length;sparks[i].position.set(Math.cos(a)*burst*.7,.3+Math.sin(burst*Math.PI)*.7,Math.sin(a)*burst*.7);}},dispose(){group.removeFromParent();ring.geometry.dispose();ring.material.dispose();texture.dispose();label.material.dispose();geo.dispose();mat.dispose();prop.traverse(o=>o.geometry?.dispose());propMaterial.dispose();}};
}
