// Proxy local de délai (audit) : 127.0.0.1:3002 -> 127.0.0.1:3001, avec un délai réglable par /__delay?ms=N. Boucle locale uniquement.
import http from 'node:http';
let delay = 0;
http.createServer((req, res) => {
  if (req.url.startsWith('/__delay')) { delay = Number(new URL(req.url, 'http://x').searchParams.get('ms') || 0); res.end('delay=' + delay); return; }
  setTimeout(() => {
    const headers = { ...req.headers, host: '127.0.0.1:3001' }; if (headers.origin) headers.origin = 'http://127.0.0.1:3001'; if (headers.referer) headers.referer = headers.referer.replace(':3002', ':3001');
    const p = http.request({ host: '127.0.0.1', port: 3001, path: req.url, method: req.method, headers }, (r) => { res.writeHead(r.statusCode, r.headers); r.pipe(res); });
    p.on('error', () => { res.statusCode = 502; res.end(); }); req.pipe(p);
  }, delay);
}).listen(3002, '127.0.0.1', () => console.log('proxy de délai sur 3002'));
