// Serves the production build and the actual Vercel handler locally.
// No fake success: without backend configuration, submissions return 503.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import handler from '../api/inscription-rebais.js';

const root = resolve('dist');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };
createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://localhost:4321').pathname);
    if (path === '/api/inscription-rebais') {
      let data = '';
      for await (const chunk of req) {
        data += chunk;
        if (Buffer.byteLength(data) > 8192) { res.writeHead(413); res.end(); return; }
      }
      req.body = data;
      res.status = n => { res.statusCode = n; return res; };
      res.json = value => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(value)); return res; };
      await handler(req, res);
      return;
    }
    let file = resolve(root, '.' + path);
    if (file !== root && !file.startsWith(root + sep)) { res.writeHead(403); res.end(); return; }
    const info = await stat(file).catch(() => null);
    if (info?.isDirectory()) file = resolve(file, 'index.html');
    else if (!info && !extname(file)) file = resolve(file, 'index.html');
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(body);
  } catch { res.writeHead(404); res.end('Page introuvable'); }
}).listen(4321, '127.0.0.1', () => {
  console.log('Aperçu local : http://localhost:4321/interclubs-rebais-2026');
  console.log(process.env.REBAIS_APPS_SCRIPT_URL ? 'Backend configuré : les envois sont réels.' : 'Aucun backend configuré : aucun envoi ni inscription réelle.');
});
