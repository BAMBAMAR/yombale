// Isolation guard v2 (ALLOW-LIST): only loopback may be resolved. Everything else is refused.
const dns=require('dns');const OK=/^(localhost|127\.0\.0\.1|::1)$/i;const net=require('net');
const deny=(h)=>Object.assign(new Error('AUDIT-GUARD blocked '+h),{code:'EAUDITBLOCK'});
const orig=dns.lookup;
dns.lookup=function(h,o,cb){ if(typeof o==='function'){cb=o;o={}} if(!OK.test(String(h))&&!net.isIP(String(h))) return process.nextTick(()=>cb(deny(h))); if(net.isIP(String(h))&&!/^(127\.|::1)/.test(String(h))) return process.nextTick(()=>cb(deny(h))); return orig.call(dns,h,o,cb) };
if(dns.promises){const p=dns.promises.lookup;dns.promises.lookup=async(h,o)=>{ if(!OK.test(String(h))) throw deny(h); return p.call(dns.promises,h,o)}}
const sock=net.Socket.prototype.connect;
net.Socket.prototype.connect=function(...a){ const o=a[0]; const host=(o&&typeof o==='object')?o.host:undefined; if(host&&!OK.test(host)&&!/^(127\.|::1)/.test(host)&&net.isIP(host)){ const e=deny(host); process.nextTick(()=>this.destroy(e)); return this } return sock.apply(this,a) };
