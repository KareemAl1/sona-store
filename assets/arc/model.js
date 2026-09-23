import * as THREE from 'three';

// SONA ARC — original, deterministic product geometry.
// All dimensions are authored here; no downloaded models or image textures.
export const FINISHES = {
  pearl: { shell: '#d6d0c5', fabric: '#9da096', band: '#d4cec3', inner: '#454843', metal: '#bcb9b2' },
  graphite: { shell: '#646467', fabric: '#61666a', band: '#555659', inner: '#26292b', metal: '#aaa9a6' },
  fig: { shell: '#8a7388', fabric: '#8b7890', band: '#7f697c', inner: '#352c38', metal: '#b9b1b6' },
};

function seeded(seed=73241) { return () => { seed=(Math.imul(seed,1664525)+1013904223)>>>0; return seed/4294967296; }; }

// A single repeat is an original woven thread pattern, generated at runtime.
export function weaveTexture() {
  // Original alternating warp/weft yarns, with individual filament striations.
  const size=1024,cells=32,pitch=size/cells,random=seeded(73241),heights=new Float32Array(size*size);
  const tone=Array.from({length:cells*cells},()=>.92+random()*.16);
  const canvases={},images={},contexts={};
  for(const name of ['height','normal','albedo','roughness']){
    const canvas=document.createElement('canvas');canvas.width=canvas.height=size;
    canvases[name]=canvas;contexts[name]=canvas.getContext('2d');images[name]=contexts[name].createImageData(size,size);
  }
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const cx=Math.floor(x/pitch),cy=Math.floor(y/pitch),u=(x%pitch+.5)/pitch,v=(y%pitch+.5)/pitch;
    const horizontal=(cx+cy)%2===0,across=horizontal?v:u,along=horizontal?u:v;
    const crown=Math.sqrt(Math.max(0,1-Math.pow((across-.5)/.435,2)));
    const under=Math.sqrt(Math.max(0,1-Math.pow((along-.5)/.435,2)))*.24;
    const fiber=(Math.sin(across*Math.PI*18+Math.sin(along*Math.PI*2)*.45)*.035+Math.sin(across*Math.PI*42+along*2)*.012)*crown;
    const h=Math.max(.09+under,.16+crown*(.59+.055*Math.cos(along*Math.PI*2))+fiber)+(random()-.5)*.018;
    heights[y*size+x]=h;
    const a=(.66+.28*h)*tone[cy*cells+cx]+(random()-.5)*.075;
    const i=(y*size+x)*4;
    for(const [name,value] of [['height',h],['albedo',a],['roughness',.96-.10*crown]]){
      const data=images[name].data;data[i]=data[i+1]=data[i+2]=Math.max(0,Math.min(255,value*255));data[i+3]=255;
    }
  }
  const at=(x,y)=>heights[((y+size)%size)*size+(x+size)%size];
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const nx=(at(x-1,y)-at(x+1,y))*3.4,ny=(at(x,y-1)-at(x,y+1))*3.4,nz=1;
    const inv=1/Math.hypot(nx,ny,nz),i=(y*size+x)*4,d=images.normal.data;
    d[i]=(nx*inv*.5+.5)*255;d[i+1]=(ny*inv*.5+.5)*255;d[i+2]=(nz*inv*.5+.5)*255;d[i+3]=255;
  }
  const textures={};
  for(const name of Object.keys(canvases)){
    contexts[name].putImageData(images[name],0,0);const texture=new THREE.CanvasTexture(canvases[name]);
    texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(7,3.2);texture.anisotropy=16;
    if(name==='albedo')texture.colorSpace=THREE.SRGBColorSpace;textures[name]=texture;
  }
  return textures;
}

function sewnCurve(pointAt, count, radius, material){
  // Discrete curved stitches combined in one mesh; actual geometry at the seam.
  const positions=[],indices=[];const sides=5,steps=5;
  for(let stitch=0;stitch<count;stitch++){
    const first=positions.length/3;
    for(let j=0;j<=steps;j++){
      const u=(stitch+.14+.68*j/steps)/count,p=pointAt(u);
      const tangent=pointAt(Math.min(.999999,u+.00005)).sub(pointAt(Math.max(.000001,u-.00005))).normalize();
      const side=new THREE.Vector3().crossVectors(tangent,new THREE.Vector3(1,0,0)).normalize();
      if(side.lengthSq()<.1)side.set(0,0,1);
      const normal=new THREE.Vector3().crossVectors(side,tangent).normalize();
      for(let k=0;k<=sides;k++){
        const a=k/sides*Math.PI*2,q=p.clone().addScaledVector(side,radius*Math.cos(a)).addScaledVector(normal,radius*Math.sin(a));positions.push(...q.toArray());
      }
    }
    for(let j=0;j<steps;j++)for(let k=0;k<sides;k++){
      const a=first+j*(sides+1)+k,b=a+sides+1;indices.push(a,b,a+1,b,b+1,a+1);
    }
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();
  const mesh=new THREE.Mesh(geometry,material);mesh.name='Continuous sewn construction stitches';return mesh;
}

function paddedArch(material){
  const geometry=meshFromGrid(192,48,(u,v)=>{
    const t=.105+(Math.PI-.21)*u,a=v*Math.PI*2;
    const normal=new THREE.Vector3(Math.cos(t)/1.175,Math.sin(t)/1.414,0).normalize();
    const edge=Math.min(1,u/.025,(1-u)/.025),cap=Math.sin(edge*Math.PI/2);
    const r=(-.031+.092*Math.cos(a))*cap,z=.169*Math.sign(Math.sin(a))*Math.pow(Math.abs(Math.sin(a)),.68)*cap;
    return [1.175*Math.cos(t)+normal.x*r,2.502+1.414*Math.sin(t)+normal.y*r,z];
  });const mesh=new THREE.Mesh(geometry,material);mesh.name='Rounded padded headband underside';return mesh;
}

function meshFromGrid(uCount,vCount,sample,closedU=false,closedV=false) {
  const p=[],uv=[],idx=[];
  for(let i=0;i<=uCount;i++)for(let j=0;j<=vCount;j++){
    const a=sample(i/uCount,j/vCount);p.push(a[0],a[1],a[2]);uv.push(i/uCount,j/vCount);
  }
  for(let i=0;i<uCount;i++)for(let j=0;j<vCount;j++){
    const a=i*(vCount+1)+j,b=a+vCount+1;idx.push(a,b,a+1,b,b+1,a+1);
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
}

function surfaceOfOval(profile, ry,rz) {
  // profile = local axial depth x and elliptical radial scale.
  return meshFromGrid(128,profile.length-1,(u,v)=>{
    const i=Math.round(v*(profile.length-1)),[x,r]=profile[i],t=u*Math.PI*2;
    const pear=1-.032*Math.cos(t);
    return [x,Math.cos(t)*ry*r,Math.sin(t)*rz*r*pear];
  });
}
function ovalDisk(ry,rz,x,mat) {
  const profile=[];for(let i=0;i<=24;i++)profile.push([x,i/24]);
  return new THREE.Mesh(surfaceOfOval(profile,ry,rz),mat);
}

function ellipseRing(x,ry,rz,radius,mat) {
  const g=meshFromGrid(144,10,(u,v)=>{
    const t=u*Math.PI*2,a=v*Math.PI*2;
    return [x+radius*Math.sin(a),(ry+radius*Math.cos(a))*Math.cos(t),(rz+radius*Math.cos(a))*Math.sin(t)];
  });return new THREE.Mesh(g,mat);
}

function archStrip({xRadius=1.21,yRadius=1.51,yBase=2.50,depth=.36,thickness=.115,start=0,end=Math.PI},mat){
  // Rounded rectangular sweep. Cross-section is broad in z, thin in the arch normal.
  const g=meshFromGrid(144,32,(u,v)=>{
    const t=start+(end-start)*u,a=v*Math.PI*2;
    const n=new THREE.Vector3(Math.cos(t)/xRadius,Math.sin(t)/yRadius,0).normalize();
    const sq=(x)=>Math.sign(x)*Math.pow(Math.abs(x),.36);
    const radial=thickness*.5*sq(Math.cos(a)),z=depth*.5*sq(Math.sin(a));
    return [xRadius*Math.cos(t)+n.x*radial,yBase+yRadius*Math.sin(t)+n.y*radial,z];
  });return new THREE.Mesh(g,mat);
}

function flattenedYoke(points,material){
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
  const g=meshFromGrid(64,24,(u,v)=>{
    const p=curve.getPointAt(u),t=curve.getTangentAt(u),a=v*Math.PI*2;
    const axis=new THREE.Vector3(1,0,0),w=new THREE.Vector3().crossVectors(t,axis).normalize();
    const sq=x=>Math.sign(x)*Math.pow(Math.abs(x),.38);
    p.addScaledVector(axis,.021*sq(Math.cos(a)));p.addScaledVector(w,.05*sq(Math.sin(a)));
    return p.toArray();
  });return new THREE.Mesh(g,material);
}

export function buildHeadphones(finish='pearl'){
  const colors=FINISHES[finish];const group=new THREE.Group();group.name='Sona Arc original assembly';
  const weave=weaveTexture();
  const shell=new THREE.MeshPhysicalMaterial({color:colors.shell,metalness:.37,roughness:.34,clearcoat:.14,clearcoatRoughness:.42});
  const band=new THREE.MeshPhysicalMaterial({color:colors.band,metalness:.24,roughness:.39});
  const fabric=new THREE.MeshPhysicalMaterial({color:colors.fabric,map:weave.albedo,roughness:1,roughnessMap:weave.roughness,metalness:0,normalMap:weave.normal,normalScale:new THREE.Vector2(.65,.65),sheen:.72,sheenRoughness:.85,sheenColor:new THREE.Color(colors.fabric).multiplyScalar(1.7)});
  const lining=new THREE.MeshStandardMaterial({color:colors.inner,map:weave.albedo,roughness:1,normalMap:weave.normal,normalScale:new THREE.Vector2(.38,.38)});
  const metal=new THREE.MeshPhysicalMaterial({color:colors.metal,metalness:.96,roughness:.235});
  const welt=new THREE.MeshStandardMaterial({color:new THREE.Color(colors.fabric).multiplyScalar(.4),roughness:.98});
  const thread=new THREE.MeshStandardMaterial({color:new THREE.Color(colors.fabric).multiplyScalar(.95),roughness:.93});
  for(const material of [fabric,lining,welt,thread])material.userData.textile=true;
  const seam=new THREE.MeshStandardMaterial({color:new THREE.Color(colors.shell).multiplyScalar(.56),metalness:.32,roughness:.57});
  const dark=new THREE.MeshStandardMaterial({color:'#111315',roughness:.8});
  const hardware=new THREE.MeshStandardMaterial({color:new THREE.Color(colors.shell).multiplyScalar(.83),metalness:.55,roughness:.37});

  const outerProfile=[
    [.334,0],[.334,.08],[.332,.18],[.328,.30],[.321,.44],[.310,.58],[.293,.71],
    [.269,.81],[.238,.89],[.205,.946],[.176,.974],[.145,.992],[.111,1.002],
    [.073,1.006],[.022,1.006],[-.018,1.003],[-.043,.991],[-.052,.97],[-.052,0],
  ];
  for(const side of [-1,1]){
    const cup=new THREE.Group();cup.name=side===1?'Right cup':'Left cup';
    cup.position.set(side*.865,1.135,0);cup.rotation.order='ZYX';cup.rotation.z=side*-.22;
    if(side===-1)cup.rotation.y=Math.PI;
    cup.add(new THREE.Mesh(surfaceOfOval(outerProfile,1.067,.724),shell));
    cup.add(ellipseRing(.17,1.035,.702,.0105,seam));
    cup.add(ellipseRing(-.046,1.055,.712,.012,hardware));
    const cushionGeometry=meshFromGrid(144,36,(u,v)=>{
      const t=u*Math.PI*2,a=v*Math.PI*2;
      // Flatten the contact surface while keeping rounded stitched edges.
      const q=Math.sign(Math.sin(a))*Math.pow(Math.abs(Math.sin(a)),.64);
      return [-.171+.175*q,(.865+.177*Math.cos(a))*Math.cos(t),(.548+.168*Math.cos(a))*Math.sin(t)];
    });
    const cushion=new THREE.Mesh(cushionGeometry,fabric);cushion.name='Woven acoustic cushion';cup.add(cushion);
    cup.add(ovalDisk(.77,.455,-.135,lining));
    cup.add(ellipseRing(-.168,.715,.402,.008,lining));
    // Fine peripheral seam in the textile, not an image-based decal.
    const seamX=-.171-.175*Math.pow(Math.SQRT1_2,.64),seamY=.865+.177*Math.SQRT1_2,seamZ=.548+.168*Math.SQRT1_2;
    cup.add(ellipseRing(seamX,seamY,seamZ,.004,welt));
    cup.add(sewnCurve(u=>{const t=u*Math.PI*2;return new THREE.Vector3(seamX-.0055,(seamY+.003)*Math.cos(t),(seamZ+.003)*Math.sin(t));},148,.0024,thread));
    // A restrained rear-edge control and a tiny milled microphone slot.
    if(side===-1){
      const button=new THREE.Mesh(new THREE.CapsuleGeometry(.044,.118,8,20),hardware);
      button.position.set(.036,-.32,.684);button.rotation.x=.30;cup.add(button);
      const inset=new THREE.Mesh(new THREE.CapsuleGeometry(.035,.11,8,20),seam);
      inset.position.copy(button.position);inset.position.z-=.010;inset.scale.set(1.28,1.15,1);cup.add(inset);
    }
    if(side===1){
      const slot=new THREE.Mesh(new THREE.CapsuleGeometry(.009,.070,5,12),dark);
      slot.position.set(.041,-.825,.449);slot.rotation.x=-.85;cup.add(slot);
      const led=new THREE.Mesh(new THREE.SphereGeometry(.012,12,8),hardware);led.position.set(.038,-.724,.52);cup.add(led);
    }
    group.add(cup);
    // Two arms cradle each cup. Their cross sections are flattened, not tubes.
    for(const fore of [-1,1]){
      group.add(flattenedYoke([
        [side*1.207,2.535,0],
        [side*1.209,2.354,fore*.145],
        [side*1.211,2.18,fore*.354],
        [side*1.214,1.927,fore*.524],
        [side*1.195,1.66,fore*.577],
      ],metal));
      const pivot=new THREE.Mesh(new THREE.CylinderGeometry(.051,.051,.031,32),metal);
      pivot.rotation.z=Math.PI/2;pivot.position.set(side*1.185,1.66,fore*.575);group.add(pivot);
    }
  }
  group.add(archStrip({},band));
  group.add(paddedArch(fabric));
  for(const z of [-.148,.148]){
    group.add(sewnCurve(u=>{const t=.17+(Math.PI-.34)*u,n=new THREE.Vector3(Math.cos(t)/1.175,Math.sin(t)/1.414,0).normalize();return new THREE.Vector3(1.175*Math.cos(t)-n.x*.079,2.502+1.414*Math.sin(t)-n.y*.079,z);},126,.0026,thread));
  }
  // Tiny edge piping preserves a crisp silhouette on the textile underside.
  for(const z of [-.173,.173]){
    const curve=new THREE.EllipseCurve(0,2.50,1.21,1.51,0,Math.PI,false,0);
    const pts=curve.getPoints(144).map(p=>new THREE.Vector3(p.x,p.y,z));
    group.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),144,.008,6,false),metal));
  }
  group.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.material.side=THREE.DoubleSide;}});
  group.userData.finish=finish;return group;
}

export function studioEnvironment(){
  const width=1024,height=512,data=new Float32Array(width*height*4);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const u=x/width,v=y/height,i=(y*width+x)*4;
    let r=.026,g=.020,b=.03;
    const rect=(cx,cy,wx,wy,pow=8)=>Math.exp(-(Math.pow(Math.abs((u-cx)/wx),pow)+Math.pow(Math.abs((v-cy)/wy),pow)));
    const key=rect(.74,.30,.105,.17)*4.6;
    const fill=rect(.19,.37,.075,.20)*.9;
    const rim=rect(.44,.34,.025,.21)*2.0;
    const top=rect(.52,.12,.26,.047)*1.5;
    r+=key+fill*.80+rim*.88+top;g+=key*.96+fill*.83+rim*.91+top*.93;b+=key*.92+fill+rim+top*.92;
    data[i]=r;data[i+1]=g;data[i+2]=b;data[i+3]=1;
  }
  const tex=new THREE.DataTexture(data,width,height,THREE.RGBAFormat,THREE.FloatType);
  tex.mapping=THREE.EquirectangularReflectionMapping;tex.needsUpdate=true;return tex;
}

export function createScene(finish='pearl',detail=false){
  const scene=new THREE.Scene();scene.background=new THREE.Color('#28202e');scene.environment=studioEnvironment();
  const headphones=buildHeadphones(finish);scene.add(headphones);
  const plinthMat=new THREE.MeshStandardMaterial({color:'#312935',roughness:.98,metalness:0});
  const plinth=new THREE.Mesh(new THREE.BoxGeometry(20,.85,12),plinthMat);plinth.position.set(0,-.43,-3.8);plinth.receiveShadow=true;scene.add(plinth);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:'#28202e',roughness:1}));
  floor.rotation.x=-Math.PI/2;floor.position.y=-.864;floor.receiveShadow=true;scene.add(floor);
  const wall=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:'#413446',roughness:1}));
  wall.rotation.y=Math.atan2(7.2,6.8);wall.position.set(-2.55,1,-2.40);wall.receiveShadow=true;scene.add(wall);
  const key=new THREE.RectAreaLight('#fff3e6',8,4.0,5.0);key.position.set(-3.5,6.5,5);key.lookAt(0,1.6,0);scene.add(key);
  const rim=new THREE.RectAreaLight('#c8bed8',6,2.5,4);rim.position.set(4.0,4,-2.5);rim.lookAt(0,2,0);scene.add(rim);
  const fill=new THREE.RectAreaLight('#e0d4e5',1.2,3,4);fill.position.set(5,2.8,5);fill.lookAt(0,2,0);scene.add(fill);
  const aspect=1100/1500;
  const camera=new THREE.PerspectiveCamera(35,aspect,.1,100);
  if(detail){
    camera.position.set(-3.4,2.3,3.8);camera.lookAt(.74,1.34,.1);camera.fov=22;
    const backdropNormal=new THREE.Vector3(-3.4-.74,0,3.8-.1).normalize();
    wall.rotation.y=Math.atan2(backdropNormal.x,backdropNormal.z);wall.position.set(.74-backdropNormal.x*3.5,1,.1-backdropNormal.z*3.5);
  }
  else{camera.position.set(7.2,3.45,6.8);camera.lookAt(0,1.94,0);camera.fov=30;}
  camera.updateProjectionMatrix();
  return {scene,camera,headphones};
}
