import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml'};
http.createServer(async (req,res) => {
  try {
    let url = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if (!url.startsWith('/ai-weekly/')) {res.writeHead(302,{Location:'/ai-weekly/'});res.end();return;}
    url = url.slice('/ai-weekly/'.length) || 'index.html';
    const file = path.resolve(root,url);
    if (!file.startsWith(root) || url.split('/').some(p=>p.startsWith('.'))) {res.writeHead(403);res.end();return;}
    const body = await readFile(file);
    res.writeHead(200,{'Content-Type':types[path.extname(file)] || 'application/octet-stream'});
    res.end(body);
  } catch {if (!res.headersSent) res.writeHead(404);res.end('No encontrado');}
}).listen(4173,'127.0.0.1',()=>console.log('AI Weekly: http://127.0.0.1:4173/ai-weekly/'));
