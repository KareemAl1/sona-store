const fs=require('fs'),path=require('path'),crypto=require('crypto');
const sharp=require('sharp');
(async()=>{
 const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
 const prior=JSON.parse(fs.readFileSync(path.join(__dirname,'asset-verification.json'),'utf8'));
 const result={camera:{position:[7.2,3.45,6.8],target:[0,1.94,0],verticalFov:30,aspect:1},samples:256,assets:[],existingAssetsUnchanged:true};
 for(const original of prior.assets){if(hash(fs.readFileSync(path.join(__dirname,original.name)))!==original.sha256)result.existingAssetsUnchanged=false;}
 for(const finish of ['pearl','graphite','fig']){
  const name=`sona-${finish}-square.png`,buf=fs.readFileSync(path.join(__dirname,name)),m=await sharp(buf).metadata();
  if(m.width!==1100||m.height!==1100)throw new Error('Unexpected square size: '+name);
  result.assets.push({name,width:m.width,height:m.height,bytes:buf.length,sha256:hash(buf)});
 }
 if(!result.existingAssetsUnchanged)throw new Error('An original asset changed');
 fs.writeFileSync(path.join(__dirname,'square-verification.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
})().catch(e=>{console.error(e);process.exit(1)});
