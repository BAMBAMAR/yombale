// Matrice RBAC : pour chaque rôle et chaque route, « refusé (403) » doit correspondre exactement à l'absence de permission
process.env.JWT_SECRET='audit-jwt-secret-not-prod';
const {ROLE_PERMISSIONS}=require(''+require('path').resolve(__dirname,'../..')+'/backend/middlewares/admin-rbac.js');
const H='http://localhost:4100';const SEC={'x-admin-secret':'audit-admin-secret','content-type':'application/json'};
const U='00000000-0000-4000-8000-000000000001';
async function j(m,u,b,h){const r=await fetch(H+u,{method:m,headers:{'content-type':'application/json',...(h||{})},body:b?JSON.stringify(b):undefined});let x=await r.text();try{x=JSON.parse(x)}catch{}return{s:r.status,d:x}}
const ROUTES=[
 ['GET','/api/prospection/leads','crm:view'],['DELETE',`/api/prospection/leads/${U}`,'crm:edit'],['POST','/api/prospection/leads/nettoyer','crm:edit'],['POST','/api/prospection/auto-collecte','crm:edit'],['POST','/api/prospection/blacklist','crm:edit'],
 ['GET','/api/feature-flags/admin/tous','settings:view'],['PUT','/api/feature-flags/admin/POS_ENABLED','settings:edit'],['DELETE','/api/feature-flags/admin/INEXISTANT','settings:edit'],
 ['GET','/api/whatsapp/admin/sessions','whatsapp:view'],['DELETE','/api/whatsapp/admin/sessions','whatsapp:edit'],['PATCH',`/api/whatsapp/admin/support/${U}`,'whatsapp:reply'],['POST','/api/whatsapp/admin/toggle','whatsapp:edit'],
 ['POST','/api/telecom/sync-artp','produits:edit'],['POST',`/api/qualite/quarantines/${U}/validate`,'produits:moderate'],['GET','/api/qualite/quarantines','produits:view'],
 ['GET','/api/settings','settings:view'],['PUT','/api/settings','settings:edit'],
 ['GET','/api/admin/audit-logs/','audit:view'],['GET','/api/admin/commandes/','commandes:view'],['PUT',`/api/admin/commandes/${U}/statut`,'commandes:edit'],
 ['GET','/api/admin/pos/stats','pos:view'],['GET','/api/admin/pos/sessions','pos:view'],['GET','/api/admin/omnisearch/','users:view'],
 ['POST','/api/admin/migration/csv-batch','__super__'],['GET','/api/scraper/status','settings:view'],['POST','/api/scraper/run','settings:edit'],
 ['GET','/api/admin/credits/','credits:view'],['GET','/api/admin/paiements/','paiements:view'],['GET','/api/admin/produits/','produits:view'],['GET','/api/admin/immo-global/','immo:view'],
];
(async()=>{
 const roles=['support_client','moderateur','finance','admin_operationnel'];const tok={};
 for(const r of roles){ const email=`rbac_${r}_${Date.now()}@audit.test`; await j('POST','/api/admin/equipe',{nom:'RBAC '+r,email,password:'Audit!Pass2026x',role:r},SEC); const l=await j('POST','/api/admin/auth/login',{email,password:'Audit!Pass2026x'}); tok[r]={authorization:'Bearer '+l.d.token} }
 tok.super_admin=SEC;
 let total=0,bad=0; const lines=[];
 for(const role of [...roles,'super_admin']){ const perms=ROLE_PERMISSIONS[role]||{all:true};
  for(const [m,u,key] of ROUTES){ const attendu = role==='super_admin' ? true : (key==='__super__' ? false : !!(perms.all||perms[key]));
   const r=await j(m,u,m==='GET'?undefined:{},tok[role]); const refuse=(r.s===403); const ok=(attendu&&!refuse)||(!attendu&&refuse); total++;
   if(!ok){bad++;lines.push(`MISMATCH ${role.padEnd(18)} ${m.padEnd(6)} ${u.slice(0,55).padEnd(56)} perm=${key} attendu=${attendu?'autorisé':'refusé'} obtenu=${r.s}`)} } }
 lines.forEach(l=>console.log(l)); console.log(`\nRBAC matrice : ${total-bad}/${total} conformes (${roles.length+1} rôles x ${ROUTES.length} routes)`);
})();
