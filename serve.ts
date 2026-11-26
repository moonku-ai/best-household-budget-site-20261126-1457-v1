// Server statis kecil untuk pengembangan lokal: menyajikan app/ di
// http://localhost:8080 (`node serve.ts --port <n>` untuk port lain).
// Bukan bagian dari penilaian.
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('./app', import.meta.url)));
const args = process.argv.slice(2);
const portArg = args.indexOf('--port');
const wanted = portArg === -1 ? 8080 : Number(args[portArg + 1]);
const port = Number.isInteger(wanted) && wanted > 0 && wanted < 65536 ? wanted : 8080;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};

createServer((req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname));
  const file = join(root, path === '/' ? 'index.html' : path);
  if (!file.startsWith(root + sep) && file !== root) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  try {
    const st = statSync(file);
    if (!st.isFile()) throw new Error('not a file');
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream' });
    createReadStream(file).pipe(res);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
}).listen(port, () => {
  console.log(`DompetKeluarga di http://localhost:${port}`);
});
