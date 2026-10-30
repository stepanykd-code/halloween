import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {root,siteFiles} from './lib.mjs';
const base=process.argv.find(value=>value.startsWith('--base='))?.slice(7)||'/';
if(!/^\/(?:[a-zA-Z0-9_.-]+\/)*$/.test(base))throw new Error('Use --base=/repository-name/');
const port=Number(process.env.PORT||8765);
if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Invalid port.');
const allowed=new Set(await siteFiles());
const types={html:'text/html; charset=utf-8',css:'text/css; charset=utf-8',mjs:'text/javascript; charset=utf-8',png:'image/png',webp:'image/webp'};
const server=http.createServer(async(request,response)=>{
  try{
    const pathname=decodeURIComponent(new URL(request.url,'http://localhost').pathname);
    if(!pathname.startsWith(base)){response.writeHead(404).end('Not found');return;}
    const file=pathname.slice(base.length)||'index.html';
    if(!allowed.has(file)){response.writeHead(404).end('Not found');return;}
    const content=await readFile(resolve(root,file));
    response.writeHead(200,{'Content-Type':types[file.split('.').pop()]||'application/octet-stream','Cache-Control':'no-store'}).end(content);
  }catch{response.writeHead(404).end('Not found');}
});
server.listen(port,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:'+port+base));
