const fs=require('fs'),path=require('path'),crypto=require('crypto');
const sharp=require('sharp');
(async()=>{
 const result={camera:{position:[7.2,3.45,6.8],target:[0,1.94,0],verticalFov:30},heroSamples:256,detailSamples:384,assets:[]};
 for(const name of ['sona-pearl-path.png','sona-graphite-path.png','sona-fig-path.png','sona-pearl-detail-path.png']){
  const file=path.join(__dirname,name),buf=fs.readFileSync(file),m=await sharp(buf).metadata();
  const {data,info}=await sharp(buf).removeAlpha().raw().toBuffer({resolveWithObject:true});let blackPixels=0;
  for(let i=0;i<data.length;i+=info.channels)if(data[i]+data[i+1]+data[i+2]===0)blackPixels++;
  result.assets.push({name,width:m.width,height:m.height,bytes:buf.length,sha256:crypto.createHash('sha256').update(buf).digest('hex'),exactBlackPixels:blackPixels});
 }
 fs.writeFileSync(path.join(__dirname,'asset-verification.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
})().catch(e=>{console.error(e);process.exit(1)});
