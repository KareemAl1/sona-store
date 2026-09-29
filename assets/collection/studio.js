import * as THREE from 'three';

// Shared Sona procedural weave and studio, authored for Arc; no external textures.
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

