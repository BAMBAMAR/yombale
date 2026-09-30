const { j, db, save } = require('./lib');
(async () => {
  const sfx = Date.now().toString(36); const pw = 'Audit!Pass2026x'; const S = { sfx };
  for (const [k, tel] of [['M', '7712' + Math.floor(10000 + Math.random() * 89999)], ['N', '7713' + Math.floor(10000 + Math.random() * 89999)]]) {
    const r = await j('POST', '/api/auth/inscription', { nom: 'P6 ' + k, email: `p6${k.toLowerCase()}.${sfx}@audit.test`, mot_de_passe: pw });
    S[k] = { reg: r.s, token: r.d.token, uid: r.d.user && r.d.user.id, tel };
    const b = await j('POST', '/api/boutiques', { nom: `Boutique P6 ${k} ${sfx}`, telephone: tel, ville: 'Dakar', categorie: 'mode' }, S[k].token);
    S[k].boutique = { s: b.s, id: (b.d.boutique && b.d.boutique.id) || b.d.id, raw: b.s >= 300 ? b.d : undefined };
  }
  save(S); console.log(JSON.stringify(S, (k, v) => k === 'token' ? '<tok>' : v, 1));
})();
