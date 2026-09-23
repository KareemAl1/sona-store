import * as THREE from 'three';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { WebGLPathTracer, DenoiseMaterial } from 'three-gpu-pathtracer';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { createScene } from './model.js';

const params=new URLSearchParams(location.search);
const finish=params.get('finish')||'pearl',detail=params.has('detail'),mode=params.get('mode')||'path';
const width=+(params.get('width')||1100),height=+(params.get('height')||1500);
const samples=+(params.get('samples')||128);
RectAreaLightUniformsLib.init();
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});
renderer.setPixelRatio(1);renderer.setSize(width,height);renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.9;
document.body.appendChild(renderer.domElement);
const {scene,camera,headphones}=createScene(finish,detail);camera.aspect=width/height;camera.updateProjectionMatrix();
window.statusInfo={stage:'initializing',samples:0,finish};
window.capture=()=>renderer.domElement.toDataURL('image/png');
window.exportGeometry=async()=>{
 const exporter=new GLTFExporter();
 const buffer=await exporter.parseAsync(headphones,{binary:true});
 return await new Promise(resolve=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.readAsDataURL(new Blob([buffer],{type:'model/gltf-binary'}));});
};
if(mode==='raster'){
 const shadow=new THREE.DirectionalLight('#fff3eb',1.7);shadow.position.set(-3,7,5);shadow.castShadow=true;
 shadow.shadow.mapSize.set(2048,2048);Object.assign(shadow.shadow.camera,{left:-5,right:5,top:6,bottom:-4,near:.1,far:30});
 shadow.shadow.normalBias=.02;shadow.shadow.bias=-.0002;shadow.shadow.radius=4;scene.add(shadow);
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 renderer.render(scene,camera);window.statusInfo={stage:'complete',samples:1,finish};
} else {
 const tracer=new WebGLPathTracer(renderer);tracer.bounces=5;tracer.filterGlossyFactor=.5;tracer.renderDelay=0;
 // Reject a nonfinite path sample before accumulation; rare tangent/sheens can
 // otherwise poison the accumulated pixel on some D3D shader backends.
 const ptMaterial=tracer._pathTracer.material;
 ptMaterial.fragmentShader=ptMaterial.fragmentShader.replace('gl_FragColor.a *= opacity;',
  'if (any(isnan(gl_FragColor.rgb)) || any(isinf(gl_FragColor.rgb))) gl_FragColor.rgb = vec3(0.0); gl_FragColor.a *= opacity;');
 ptMaterial.needsUpdate=true;
 tracer.fadeDuration=0;tracer.minSamples=1;tracer.rasterizeScene=false;tracer.dynamicLowRes=false;
 tracer.tiles.set(2,2);tracer.stableNoise=true;tracer.setScene(scene,camera);
 window.tracer=tracer;window.statusInfo.stage='rendering';
 function render(){
  tracer.renderSample();window.statusInfo.samples=tracer.samples;
  if(tracer.samples<samples)requestAnimationFrame(render);else {
   // An exact material mask keeps yarn/stitch detail while smoothing the satin
   // shell and background more strongly. This is deterministic native rendering.
   const maskTarget=new THREE.WebGLRenderTarget(width,height);
   const white=new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide,toneMapped:false});
   const black=new THREE.MeshBasicMaterial({color:0,side:THREE.DoubleSide,toneMapped:false});
   const saved=[];scene.traverse(object=>{if(object.isMesh){saved.push([object,object.material]);object.material=object.material.userData.textile?white:black;}});
   const background=scene.background;scene.background=new THREE.Color(0);
   renderer.setRenderTarget(maskTarget);renderer.render(scene,camera);
   for(const [object,material] of saved)object.material=material;scene.background=background;
   const denoise=new DenoiseMaterial({map:tracer.target.texture,sigma:2.3,kSigma:1.5,threshold:.075});
   denoise.uniforms.textileMask={value:maskTarget.texture};
   denoise.fragmentShader=denoise.fragmentShader.replace('uniform sampler2D map;', 'uniform sampler2D map; uniform sampler2D textileMask;');
   denoise.fragmentShader=denoise.fragmentShader.replace('smartDeNoise( map, vec2( vUv.x, vUv.y ), sigma, kSigma, threshold )',
    'smartDeNoise( map, vec2( vUv.x, vUv.y ), mix(2.3,1.0,texture2D(textileMask,vUv).r), kSigma, mix(0.075,0.024,texture2D(textileMask,vUv).r) )');
   const quad=new FullScreenQuad(denoise);renderer.setRenderTarget(null);quad.render(renderer);
   window.statusInfo.stage='complete';
  }
 }render();
}
