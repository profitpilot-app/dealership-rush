import * as T from 'three';
import {batchGroup} from './mesh-utils.js';
import {car} from './showroom.js';
const teams={w:0x99283b,b:0x245399};
export function figurine(piece){
 const g=new T.Group();const color=teams[piece.color];
 const resin=new T.MeshStandardMaterial({color,roughness:.25,metalness:.38});
 const shade=new T.MeshStandardMaterial({color:new T.Color(color).multiplyScalar(.60),roughness:.42,metalness:.2});
 const highlight=new T.MeshStandardMaterial({color:new T.Color(color).lerp(new T.Color(0xffffff),.32),roughness:.4,metalness:.25});
 const brass=new T.MeshStandardMaterial({color:0xc8ad75,roughness:.27,metalness:.78});
 const add=(geo,x,y,z,mat=resin)=>{const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;};
 const box=(w,h,d,x,y,z,mat=resin)=>add(new T.BoxGeometry(w,h,d),x,y,z,mat);
 const cyl=(rt,rb,h,x,y,z,mat=resin)=>add(new T.CylinderGeometry(rt,rb,h,24),x,y,z,mat);
 const ellipsoid=(rx,ry,rz,x,y,z,mat=resin)=>{const m=add(new T.SphereGeometry(1,16,12),x,y,z,mat);m.scale.set(rx,ry,rz);return m;};
 const limb=(a,b,r=.048,mat=resin)=>{const start=new T.Vector3(...a),end=new T.Vector3(...b),d=end.clone().sub(start);const m=add(new T.CylinderGeometry(r,r*1.15,d.length(),12),...start.clone().add(end).multiplyScalar(.5).toArray(),mat);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return m;};
 // Turned plinth, metal reveal, and small role emblem.
 cyl(.355,.37,.10,0,.07,0,shade);cyl(.351,.351,.024,0,.132,0,brass);cyl(.31,.345,.08,0,.181,0);cyl(.29,.31,.035,0,.237,0);
 if(piece.type==='r'){
  box(.58,.62,.50,0,.565,0);box(.68,.075,.6,0,.91,0);box(.64,.03,.57,0,.958,0,brass);
  const glass=new T.MeshStandardMaterial({color:piece.color==='w'?0x34242c:0x182c44,roughness:.15,metalness:.6});
  for(const x of [-.19,0,.19])box(.167,.4,.02,x,.54,.258,glass);
  for(const z of [-.15,.05])box(.016,.4,.17,.296,.54,z,glass);
  for(const x of [-.285,-.095,.095,.285])box(.018,.43,.034,x,.54,.277,brass);
  box(.59,.025,.032,0,.34,.278,brass);box(.60,.10,.02,0,.817,.27,shade);
  // Miniature car in the showroom window.
  const display=car(color);display.scale.setScalar(.19);display.rotation.y=Math.PI/2;display.position.set(0,.305,.26);g.add(display);
 }else{
  const scale={p:.70,n:.85,b:.91,q:1.02,k:1.13}[piece.type];
  const Y=y=>.255+y*scale;
  // Separate trousers, shoes, tailored jacket and shoulders replace cone bodies.
  for(const x of [-.087,.087]){
   ellipsoid(.067,.045,.12,x,Y(.045),.036,shade);
   limb([x,Y(.1),0],[x*.87,Y(.42),0],.061);
  }
  const torso=new T.Shape();torso.moveTo(-.16,-.2);torso.lineTo(.16,-.2);torso.lineTo(.205,.15);torso.quadraticCurveTo(0,.23,-.205,.15);torso.closePath();
  const jacket=add(new T.ExtrudeGeometry(torso,{depth:.16,bevelEnabled:true,bevelSize:.025,bevelThickness:.025,bevelSegments:2,steps:1}),0,Y(.61),-.085);jacket.scale.y=scale;
  cyl(.063,.068,.085,0,Y(.86),0);
  ellipsoid(.105,.14,.10,0,Y(.997),0);
  // Sculpted jaw, ears, nose and hair; all remain monochrome collectibles.
  ellipsoid(.078,.05,.079,0,Y(.915),.017);
  for(const x of [-.108,.108])ellipsoid(.017,.035,.022,x,Y(.99),0);
  ellipsoid(.022,.032,.038,0,Y(.98),.092);
  ellipsoid(.108,.058,.103,0,Y(1.095),-.012,shade);
  if(piece.type==='q'){ellipsoid(.113,.135,.066,0,Y(1.01),-.073,shade);}
  if(piece.type==='n'){
   cyl(.116,.119,.04,0,Y(1.092),0);box(.23,.025,.15,0,Y(1.08),.10);
   // Work shirt seam and breast pocket.
   box(.018,.24*scale,.012,0,Y(.63),.105,shade);box(.075,.078,.015,-.09,Y(.72),.108,highlight);
   limb([-.19,Y(.75),0],[-.24,Y(.5),.07]);limb([-.24,Y(.5),.07],[-.11,Y(.48),.16]);
   limb([.19,Y(.75),0],[.24,Y(.55),.06]);limb([.24,Y(.55),.06],[.25,Y(.78),.20]);
   ellipsoid(.053,.054,.055,.25,Y(.78),.20);
   limb([.21,Y(.48),.22],[.32,Y(1.01),.22],.027,highlight);
   const jaw=add(new T.TorusGeometry(.085,.028,8,20,Math.PI*1.5),.33,Y(1.08),.22,highlight);jaw.rotation.z=-.8;
  }else{
   // Shirt front and lapels.
   const shirt=add(new T.ConeGeometry(.085,.26*scale,3),0,Y(.7),.107,highlight);shirt.rotation.z=Math.PI;
   const tie=add(new T.ConeGeometry(.023,.20*scale,4),0,Y(.67),.133,shade);tie.rotation.z=Math.PI;
   for(const s of [-1,1]){const lapel=box(.063,.20*scale,.027,s*.07,Y(.72),.119);lapel.rotation.z=s*.31;}
   for(const y of [.52,.61])ellipsoid(.009,.01,.009,.025,Y(y),.118,brass);
   if(piece.type==='k'){
    limb([-.19,Y(.75),0],[-.22,Y(.51),.015]);limb([-.22,Y(.51),.015],[-.135,Y(.43),.11]);ellipsoid(.05,.055,.045,-.135,Y(.43),.11);
    limb([.19,Y(.76),0],[.27,Y(.88),.02]);limb([.27,Y(.88),.02],[.31,Y(1.1),.045]);ellipsoid(.049,.057,.044,.31,Y(1.1),.045);
    add(new T.TorusGeometry(.057,.013,8,20),.365,Y(1.06),.058,brass);box(.028,.14,.025,.365,Y(.93),.058,brass);box(.065,.025,.025,.383,Y(.89),.058,brass);
   }else if(piece.type==='b'||piece.type==='q'){
    limb([-.19,Y(.76),0],[-.23,Y(.54),.09]);limb([-.23,Y(.54),.09],[-.045,Y(.57),.23]);ellipsoid(.045,.045,.035,-.045,Y(.57),.23);
    limb([.19,Y(.75),0],[.23,Y(.54),.05]);limb([.23,Y(.54),.05],[.11,Y(.47),.19]);
    const folder=box(.245,.32,.045,.105,Y(.59),.186,shade);folder.rotation.z=-.14;
    if(piece.type==='b'){box(.19,.25,.012,.105,Y(.595),.214,highlight);box(.065,.04,.018,.105,Y(.735),.226,brass);for(let i=0;i<4;i++)box(.135,.006,.006,.105,Y(.65-i*.045),.223,shade);}
    else{box(.016,.29,.01,.005,Y(.59),.216,brass);}
   }else{
    // Salesperson: open polo collar, name badge, one hand on the hip.
    limb([-.19,Y(.75),0],[-.24,Y(.50),0]);limb([-.24,Y(.50),0],[-.13,Y(.42),.1]);
    limb([.19,Y(.75),0],[.20,Y(.44),.06]);ellipsoid(.045,.05,.04,.20,Y(.41),.06);
    box(.085,.042,.013,-.087,Y(.71),.134,brass);
   }
  }
 }
 const result=batchGroup(g);result.rotation.y=piece.color==='w'?0:Math.PI;result.userData={square:piece.square,type:piece.type};return result;
}
