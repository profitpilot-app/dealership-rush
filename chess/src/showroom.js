import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
const material=(color,roughness=.5,metalness=.15)=>new T.MeshStandardMaterial({color,roughness,metalness});

function grainTexture(wood=false){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;const c=canvas.getContext('2d');const pixels=c.createImageData(512,512);
 for(let y=0;y<512;y++)for(let x=0;x<512;x++){
  const warp=Math.sin(y*.023)*11+Math.sin(x*.025+y*.009)*9;
  const pattern=wood?Math.sin((x+warp)*.31)*.5+Math.sin((x+warp)*.095)*.3:Math.sin(x*.015+Math.sin(y*.017)*2+Math.sin(x*.007+y*.014))*Math.sin(y*.012+x*.021);
  const n=Math.sin(x*12.9898+y*78.233)*43758.5453;const v=wood?145+pattern*16+(n-Math.floor(n))*8:242+pattern*7;const i=(y*512+x)*4;pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=v;pixels.data[i+3]=255;
 }c.putImageData(pixels,0,0);const texture=new T.CanvasTexture(canvas);texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.colorSpace=T.SRGBColorSpace;return texture;
}
let woodTexture,marbleTexture;
export function woodMaterial(){woodTexture ||= grainTexture(true);return new T.MeshStandardMaterial({color:0x68442b,map:woodTexture,roughness:.32,metalness:.08});}
export function stoneMaterial(color){marbleTexture ||= grainTexture(false);return new T.MeshStandardMaterial({color,map:marbleTexture,roughness:.24,metalness:.2});}

function mesh(group,geometry,mat,x=0,y=0,z=0){const m=new T.Mesh(geometry,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;group.add(m);return m;}
function box(group,mat,w,h,d,x=0,y=0,z=0){return mesh(group,new T.BoxGeometry(w,h,d),mat,x,y,z);}
export function car(color=0xc3bdb2){
 const g=new T.Group(),paint=new T.MeshPhysicalMaterial({color,roughness:.23,metalness:.55,clearcoat:1,clearcoatRoughness:.15}),glass=material(0x132631,.13,.65),tire=material(0x14171a,.87,0),chrome=material(0xc1c7cd,.2,.85);
 const rb=(mat,w,h,d,x,y,z,r=.05)=>mesh(g,new RoundedBoxGeometry(w,h,d,3,r),mat,x,y,z);
 // Curved sedan coachwork, with sloped windshield and rear glass.
 rb(paint,1.12,.34,2.18,0,.40,0,.14);rb(paint,1.06,.16,1.94,0,.57,-.015,.07);
 const profile=new T.Shape();profile.moveTo(-.77,.59);profile.lineTo(-.43,.93);profile.quadraticCurveTo(-.36,1.00,-.19,1.00);profile.lineTo(.25,.98);profile.quadraticCurveTo(.35,.97,.42,.87);profile.lineTo(.68,.59);profile.closePath();
 const cabin=mesh(g,new T.ExtrudeGeometry(profile,{depth:.84,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.035,bevelThickness:.035}),glass);cabin.rotation.y=-Math.PI/2;cabin.position.x=.42;
 rb(paint,.86,.045,.69,0,1.015,-.03,.02);
 for(const side of [-1,1]){
  rb(paint,.037,.34,.052,side*.454,.80,-.04,.01);
  rb(chrome,.018,.025,1.30,side*.545,.595,-.015,.006);
  for(const z of [-.36,.32]){rb(chrome,.026,.025,.105,side*.561,.55,z,.01);rb(glass,.012,.25,.012,side*.558,.435,z-.21,.004);}
  rb(paint,.15,.075,.17,side*.60,.68,.39,.03);
  for(const z of [-.69,.68]){
   const wheel=mesh(g,new T.CylinderGeometry(.245,.245,.145,32),tire,side*.54,.27,z);wheel.rotation.z=Math.PI/2;
   const rim=mesh(g,new T.CylinderGeometry(.173,.173,.15,32),chrome,side*.548,.27,z);rim.rotation.z=Math.PI/2;
   const hub=mesh(g,new T.CylinderGeometry(.122,.122,.155,24),glass,side*.55,.27,z);hub.rotation.z=Math.PI/2;
   for(let i=0;i<5;i++){const spoke=rb(chrome,.16,.023,.29,side*.552,.27,z,.008);spoke.rotation.x=i*Math.PI/5;}
  }
 }
 const lamps=new T.MeshStandardMaterial({color:0xffedcf,emissive:0xffe6b8,emissiveIntensity:.7});const rear=new T.MeshStandardMaterial({color:0xb52335,emissive:0xff1025,emissiveIntensity:.35});
 rb(glass,.56,.16,.04,0,.40,1.075,.025);
 for(let i=0;i<4;i++)rb(chrome,.49,.009,.045,0,.35+i*.032,1.098,.004);
 for(const x of [-.39,.39]){rb(lamps,.26,.065,.06,x,.55,1.035,.025);rb(rear,.26,.07,.05,x,.55,-1.06,.022);}
 rb(chrome,.91,.027,.045,0,.27,1.065,.01);rb(glass,.97,.055,.06,0,.25,-1.055,.02);
 return g;
}
function sign(text,subtitle){
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;const c=canvas.getContext('2d');c.fillStyle='#152b35';c.fillRect(0,0,1024,256);c.fillStyle='#c6ad78';c.fillRect(80,192,864,2);c.textAlign='center';c.fillStyle='#f7f1e7';c.font='500 76px sans-serif';c.fillText(text,512,115);c.fillStyle='#b7c9c6';c.font='24px sans-serif';c.fillText(subtitle,512,163);const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;return new T.Mesh(new T.PlaneGeometry(5.7,1.1),new T.MeshBasicMaterial({map:texture}));
}
export function showroom(){
 const g=new T.Group(),floor=material(0x343c40,.27,.3),seam=material(0x222d31,.7,0),frame=material(0x3d5058,.3,.55),stone=material(0x738084,.5,.08),dark=material(0x152b35,.4,.25),brass=material(0xbda477,.3,.65);
 const ground=box(g,floor,55,.15,55,0,-3.2,0);
 // Floor grout helps the board read as a physical object within a showroom.
 for(let i=-24;i<=24;i+=3){box(g,seam,.018,.003,50,i,-3.123,0);box(g,seam,50,.003,.018,0,-3.122,i);}
 // Open-front architectural backdrop: nothing stands between camera and board.
 box(g,stone,27,6.8,.3,0,.25,-8.3);
 const glass=material(0x3d5d6d,.18,.55);
 for(let x=-12;x<=12;x+=3){box(g,glass,2.82,6.3,.06,x,.25,-8.10);box(g,frame,.09,6.8,.15,x-1.46,.25,-8);box(g,frame,2.9,.08,.12,x,1.5,-8);}
 box(g,frame,27,.12,.25,0,3.12,-8);box(g,frame,27,.15,.18,0,-2.8,-8);
 // Ceiling light banks and glossy floor strips create long reflections like a
 // premium dealership without adding image downloads to the offline build.
 const ceiling=material(0x1b282d,.48,.35),lightPanel=new T.MeshStandardMaterial({color:0xfff0cf,emissive:0xffd9a0,emissiveIntensity:2.2,roughness:.18});
 box(g,ceiling,27,.18,5.4,0,3.28,-5.5);
 for(const x of [-9,-4.5,0,4.5,9]){box(g,lightPanel,2.5,.025,.22,x,3.16,-4.8);box(g,lightPanel,2.5,.025,.22,x,3.16,-6.4);}
 const aisle=new T.MeshStandardMaterial({color:0xb9aa87,emissive:0x5c4b2c,emissiveIntensity:.24,metalness:.55,roughness:.18});
 for(const x of [-5.8,5.8])box(g,aisle,.025,.008,16,x,-3.105,-.4);
 box(g,dark,7.2,1.3,.32,0,1.9,-7.8);const masthead=sign('SHOWROOM SHOWDOWN','EVERY MOVE CLOSES A DEAL');masthead.position.set(0,1.9,-7.62);g.add(masthead);
 // Display vehicles flank the far end, leaving the board unobstructed.
 for(const [x,color,rotation] of [[-7.2,0xcbbfa3,.48],[7.2,0x275e75,-.48]]){
  const podium=mesh(g,new T.CylinderGeometry(2,2.12,.16,48),dark,x,-2.99,-6.5);const ring=mesh(g,new T.TorusGeometry(1.94,.026,8,64),brass,x,-2.89,-6.5);ring.rotation.x=Math.PI/2;
  const vehicle=car(color);vehicle.scale.setScalar(1.35);vehicle.position.set(x,-2.9,-6.5);vehicle.rotation.y=rotation;g.add(vehicle);
  const stand=box(g,frame,.04,1.05,.06,x+1.6,-2.59,-5.25);const card=box(g,stone,.47,.32,.06,x+1.6,-2.03,-5.25);card.rotation.x=-.25;
 }
 const glow=new T.MeshStandardMaterial({color:0xffdda2,emissive:0xffc579,emissiveIntensity:1.8});
 box(g,glow,25,.025,.09,0,3.02,-7.92);box(g,dark,7.4,.10,.6,0,2.7,-7.8);
 // Sales desk and lounge: original geometry, no manufacturer branding.
 for(const x of [-9.8,9.8]){
  box(g,dark,1.75,.08,.8,x,-2.2,-2.8);box(g,brass,.08,.9,.65,x-.65,-2.68,-2.8);box(g,brass,.08,.9,.65,x+.65,-2.68,-2.8);box(g,frame,.5,.33,.05,x,-1.98,-2.8);
  const pot=mesh(g,new T.CylinderGeometry(.32,.25,.48,20),stone,x,-2.84,-7.2);
  const green=material(0x3e5b48,.85,0);for(let i=0;i<5;i++){const leaf=mesh(g,new T.SphereGeometry(.35,12,8),green,x+Math.sin(i*2)*.22,-2.31+i*.13,-7.2+Math.cos(i*2)*.15);leaf.scale.set(.8,1.7,.75);}
 }
 return g;
}
