import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { FINISHES, weaveTexture, studioEnvironment } from './studio.js';

// Sona Dot and Room are authored geometric studies. Dimensions describe the
// fictional forms, not tested physical product specifications.
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
function add(parent,geometry,material,name,position=[0,0,0]){
 const mesh=new THREE.Mesh(geometry,material);mesh.name=name;mesh.position.set(...position);parent.add(mesh);return mesh;
}
function rounded(parent,size,radius,material,name,position){return add(parent,new RoundedBoxGeometry(...size,7,radius),material,name,position);}
function plate(parent,size,radius,material,name,position){
 const [w,h,d]=size,r=Math.min(radius,w/2,h/2),x=-w/2,y=-h/2,s=new THREE.Shape();
 s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);
 const bevel=Math.min(.018,d*.22);const geo=new THREE.ExtrudeGeometry(s,{depth:d-bevel*2,bevelEnabled:true,bevelSegments:5,steps:1,bevelSize:bevel,bevelThickness:bevel,curveSegments:28});geo.translate(0,0,-d/2+bevel);geo.computeVertexNormals();
 return add(parent,geo,material,name,position);
}
function oval(parent,scale,material,name,position){const m=add(parent,new THREE.SphereGeometry(1,64,40),material,name,position);m.scale.set(...scale);return m;}
function materials(finish,repeat=[7,3.2]){
 const c=FINISHES[finish],weave=weaveTexture();for(const t of Object.values(weave))t.repeat.set(...repeat);
 const fabric=new THREE.MeshPhysicalMaterial({color:c.fabric,map:weave.albedo,normalMap:weave.normal,normalScale:new THREE.Vector2(.6,.6),roughness:1,roughnessMap:weave.roughness,sheen:.68,sheenRoughness:.86,sheenColor:new THREE.Color(c.fabric).multiplyScalar(1.35)});fabric.userData.textile=true;
 return {
  shell:new THREE.MeshPhysicalMaterial({color:c.shell,metalness:.3,roughness:.31,clearcoat:.12,clearcoatRoughness:.4}),
  inner:new THREE.MeshStandardMaterial({color:new THREE.Color(c.shell).multiplyScalar(.75),metalness:.05,roughness:.57}),
  silicone:new THREE.MeshStandardMaterial({color:c.inner,roughness:.93}),
  metal:new THREE.MeshPhysicalMaterial({color:c.metal,metalness:.96,roughness:.22}),
  seam:new THREE.MeshStandardMaterial({color:new THREE.Color(c.shell).multiplyScalar(.37),roughness:.85}),
  dark:new THREE.MeshStandardMaterial({color:'#1b191e',roughness:.82}),
  gold:new THREE.MeshPhysicalMaterial({color:'#bca784',metalness:.86,roughness:.29}),fabric,
 };
}
function ring(parent,rx,ry,radius,material,name,position=[0,0,0],plane='xy'){
 const pts=[];for(let i=0;i<=160;i++){const a=i/160*Math.PI*2;pts.push(plane==='xz'?V(rx*Math.cos(a),0,ry*Math.sin(a)):V(rx*Math.cos(a),ry*Math.sin(a),0));}
 return add(parent,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),160,radius,8,true),material,name,position);
}
function roundRectPoints(width,height,radius,segments=16){
 const pts=[];for(const [cx,cy,start] of [[width/2-radius,height/2-radius,0],[-width/2+radius,height/2-radius,Math.PI/2],[-width/2+radius,-height/2+radius,Math.PI],[width/2-radius,-height/2+radius,Math.PI*1.5]]){
  for(let i=0;i<=segments;i++){const a=start+i/segments*Math.PI/2;pts.push(V(cx+Math.cos(a)*radius,cy+Math.sin(a)*radius,0));}
 }return pts;
}
function roundRectRing(parent,width,height,radius,tube,material,name,position){return add(parent,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(roundRectPoints(width,height,radius),true),160,tube,8,true),material,name,position);}

export function buildDot(finish='pearl'){
 const g=new THREE.Group();g.name='Sona Dot original earbuds and case';const m=materials(finish);
 const base=plate(g,[2.95,1.85,.87],.54,m.shell,'Rounded satin charging case',[0,.485,0]);base.rotation.x=Math.PI/2;
 const tray=plate(g,[2.70,1.60,.07],.44,m.inner,'Recessed interior tray',[0,.935,0]);tray.rotation.x=Math.PI/2;
 // Case seam is a thin separate mating line following the enclosure footprint.
 const seam=roundRectRing(g,2.956,1.856,.48,.006,m.seam,'Case perimeter assembly seam',[0,.34,0]);seam.rotation.x=Math.PI/2;
 // A continuous hinge cylinder and two matching journals connect the lid.
 const hinge=add(g,new THREE.CylinderGeometry(.10,.10,1.46,48),m.metal,'Brushed hinge barrel',[0,1.05,-.74]);hinge.rotation.z=Math.PI/2;
 for(const x of [-.82,.82]){const journal=add(g,new THREE.CylinderGeometry(.12,.12,.15,48),m.shell,'Hinge journal',[x,1.05,-.74]);journal.rotation.z=Math.PI/2;}
 const lid=new THREE.Group();lid.name='Open charging lid';lid.position.set(0,1.08,-.74);lid.rotation.x=-.22;
 plate(lid,[2.95,1.72,.28],.48,m.shell,'Open satin lid',[0,.75,0]);
 plate(lid,[2.61,1.38,.066],.36,m.inner,'Inset lid liner',[0,.75,.148]);
 roundRectRing(lid,2.65,1.42,.3,.011,m.seam,'Lid gasket and mating edge',[0,.75,.178]);
 g.add(lid);
 for(const side of [-1,1]){
  const x=side*.69;
  oval(g,[.46,.014,.55],m.dark,'Recessed earbud well',[x,.976,.13]);
  ring(g,.425,.505,.012,m.inner,'Molded well rim',[x,.982,.13],'xz');
  const bud=new THREE.Group();bud.name=side<0?'Left earbud':'Right earbud';bud.position.set(x,1.28,.11);bud.rotation.set(.13,side*.30,side*-.19);
  oval(bud,[.295,.355,.31],m.shell,'Sculpted earbud shell',[0,.12,0]);
  oval(bud,[.218,.272,.052],m.metal,'Recessed satin touch plate',[0,.148,.268]);
  oval(bud,[.197,.248,.057],m.shell,'Touch surface',[0,.148,.285]);
  ring(bud,.216,.270,.004,m.seam,'Touch surface fine seam',[0,.148,.277]);
  const stem=rounded(bud,[.165,.53,.18],.076,m.shell,'Short earbud stem',[side*.11,-.232,.145]);stem.rotation.z=side*-.11;
  oval(bud,[.11,.12,.16],m.silicone,'Soft silicone ear tip',[-side*.234,.108,-.08]);
  const aperture=oval(bud,[.005,.048,.06],m.dark,'Ear-tip opening',[-side*.333,.108,-.08]);
  const vent=add(bud,new THREE.CapsuleGeometry(.009,.066,5,12),m.dark,'Inset microphone slot',[side*.11,-.35,.242]);
  const contact=oval(bud,[.035,.012,.026],m.gold,'Charging contact',[side*.115,-.484,.145]);
  g.add(bud);
 }
 rounded(g,[.075,.023,.015],.01,m.inner,'Quiet status inset',[0,.64,.922]);
 // Back charging port is physically present, with a dark opening and metal lip.
 rounded(g,[.32,.11,.03],.035,m.metal,'Charging port rim',[0,.34,-.914]);
 rounded(g,[.27,.068,.035],.025,m.dark,'Charging port opening',[0,.34,-.932]);
 return finalize(g,finish);
}

export function buildRoom(finish='pearl'){
 const g=new THREE.Group();g.name='Sona Room original home speaker';const m=materials(finish,[5.1,7.2]);
 rounded(g,[2.70,3.82,1.97],.43,m.shell,'Sculpted satin enclosure',[0,2.01,0]);
 rounded(g,[2.37,.14,1.69],.065,m.metal,'Fine metal footing',[0,.11,0]);
 rounded(g,[2.18,.05,1.5],.024,m.dark,'Inset elastomer foot',[0,.027,0]);
 plate(g,[2.43,3.48,.16],.38,m.seam,'Inset front reveal',[0,2.02,.945]);
 const front=plate(g,[2.36,3.40,.143],.355,m.fabric,'Woven front acoustic textile',[0,2.02,1.01]);
 // Normalize original planar UVs, keeping textile density consistent on the face.
 const uv=front.geometry.getAttribute('uv');for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)/2.36,uv.getY(i)/3.4);uv.needsUpdate=true;
 roundRectRing(g,2.358,3.398,.35,.007,m.inner,'Textile perimeter sewn edge',[0,2.02,1.079]);
 // A subdued construction seam between rear shell and front frame.
 roundRectRing(g,2.58,3.7,.4,.008,m.seam,'Outer shell assembly line',[0,2.01,.36]);
 // Top rotary surface, surrounded by a precise metal lip and grip flutes.
 const knobBase=add(g,new THREE.CylinderGeometry(.325,.34,.05,80),m.seam,'Inset top control socket',[0,3.93,.05]);
 const knob=add(g,new THREE.CylinderGeometry(.29,.30,.075,80),m.metal,'Metal top control',[0,3.975,.05]);
 const face=add(g,new THREE.CylinderGeometry(.264,.264,.006,80),m.shell,'Control top satin face',[0,4.016,.05]);
 for(let i=0;i<40;i++){const a=i/40*Math.PI*2;const flute=add(g,new THREE.CylinderGeometry(.004,.004,.039,6),m.seam,'Control edge grip line',[Math.cos(a)*.291,3.987,.05+Math.sin(a)*.291]);}
 rounded(g,[.028,.004,.075],.001,m.inner,'Top control index mark',[0,4.021,-.126]);
 // Original restrained hardware accents, no invented badge or claims.
 const status=add(g,new THREE.SphereGeometry(.012,12,8),m.inner,'Status inset',[.7,3.763,.6]);status.scale.y=.14;
 rounded(g,[.43,.15,.033],.06,m.dark,'Rear power connection',[0,.5,-.989]);
 rounded(g,[.14,.06,.035],.02,m.metal,'Rear connector inset',[0,.5,-1.012]);
 return finalize(g,finish);
}
function finalize(group,finish){group.userData.finish=finish;group.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.material.side=THREE.DoubleSide;}});return group;}
export function buildProduct(product,finish){return product==='dot'?buildDot(finish):buildRoom(finish);}
export const CAMERAS={
 dot:{hero:{position:[6.5,4.3,7.6],target:[0,1.15,0],fov:27},macro:{position:[-2.2,3.55,3.6],target:[-.47,1.11,-.22],fov:25}},
 room:{hero:{position:[6.4,4.0,8.6],target:[0,2.0,0],fov:29},macro:{position:[2.5,5.8,4.0],target:[.3,3.52,.65],fov:25}},
};
export function createScene(product='dot',finish='pearl',detail=false){
 const scene=new THREE.Scene();scene.background=new THREE.Color('#28202e');scene.environment=studioEnvironment();
 const assembly=buildProduct(product,finish);scene.add(assembly);
 const plinth=add(scene,new THREE.BoxGeometry(20,.85,12),new THREE.MeshStandardMaterial({color:'#312935',roughness:.98}),'Studio plinth',[0,-.43,-3.8]);plinth.receiveShadow=true;
 const floor=add(scene,new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:'#28202e',roughness:1}),'Studio floor',[0,-.864,0]);floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;
 const setting=CAMERAS[product][detail?'macro':'hero'];
 const normal=V(setting.position[0]-setting.target[0],0,setting.position[2]-setting.target[2]).normalize();
 const wall=add(scene,new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:'#413446',roughness:1}),'Studio backdrop',[setting.target[0]-normal.x*3.5,1,setting.target[2]-normal.z*3.5]);wall.rotation.y=Math.atan2(normal.x,normal.z);wall.receiveShadow=true;
 for(const [color,intensity,width,height,position,target] of [['#fff3e6',8,4,5,[-3.5,6.5,5],[0,1.6,0]],['#c8bed8',6,2.5,4,[4,4,-2.5],[0,2,0]],['#e0d4e5',1.2,3,4,[5,2.8,5],[0,2,0]]]){const light=new THREE.RectAreaLight(color,intensity,width,height);light.position.set(...position);light.lookAt(...target);scene.add(light);}
 const camera=new THREE.PerspectiveCamera(setting.fov,detail?1.4:1,.1,100);camera.position.set(...setting.position);camera.lookAt(...setting.target);camera.updateProjectionMatrix();
 return {scene,camera,assembly};
}
