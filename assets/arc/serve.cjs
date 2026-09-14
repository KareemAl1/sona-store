const http=require('http');const fs=require('fs');const path=require('path');
const root=__dirname;const deps=path.resolve(__dirname,'../../node_modules');
http.createServer((req,res)=>{
 let u=decodeURIComponent(req.url.split('?')[0]);let p=u.startsWith('/deps/')?path.join(deps,u.slice(6)):path.join(root,u==='/'?'index.html':u);
 if(!p.startsWith(root)&&!p.startsWith(deps)){res.writeHead(403);return res.end();}
 const types={'.js':'text/javascript','.cjs':'text/javascript','.html':'text/html','.wasm':'application/wasm','.png':'image/png','.json':'application/json'};
 fs.readFile(p,(e,b)=>{if(e){res.writeHead(404);return res.end(e.message);}res.setHeader('Content-Type',types[path.extname(p)]||'application/octet-stream');res.end(b);});
}).listen(4179,'127.0.0.1',()=>console.log('Sona geometry studio: http://127.0.0.1:4179'));
