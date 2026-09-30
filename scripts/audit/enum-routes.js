process.env.NODE_ENV='test';
const app=require(''+require('path').resolve(__dirname,'../..')+'/backend/app.js');
function mountOf(l){ const s=l.regexp.source; if(l.regexp.fast_slash) return ''; 
  let m=s.replace('^\\/','/').replace('\\/?(?=\\/|$)','').replace(/\\\//g,'/').replace(/\(\?:\(\[\^\/\]\+\?\)\)/g,':p').replace('(?=/|$)','').replace(/\$$/,'').replace(/\?$/,'');
  return m.replace(/\^/g,'') }
const out=[];
function walk(stack,prefix){ for(const l of stack){ if(l.route){ for(const meth of Object.keys(l.route.methods)){ out.push({m:meth.toUpperCase(),p:(prefix+l.route.path).replace(/\/+/g,'/'),mw:l.route.stack.map(x=>x.name||'anon')}) } } else if(l.name==='router'&&l.handle.stack){ walk(l.handle.stack,prefix+mountOf(l)) } } }
walk(app._router.stack,'');
require('fs').writeFileSync(process.argv[2],JSON.stringify(out,null,1));
console.log('routes',out.length); setTimeout(()=>process.exit(0),500);
