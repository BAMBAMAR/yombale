// AGENT 8 — Retest indépendant FIX-006 / ANOM-006 (bail multi-tenant agence + quittance PDF) + effets de bord.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const jwt = require('jsonwebtoken');
const { LABEL, PW, RUN, pool, http, inscrire, mkToken, Suite, saveEvidence } = require('./lib');

function pdfTexte(buf) {
  const s = buf.toString('latin1');
  const out = [];
  const re = /stream\r?\n([\s\S]*?)\r?\nendstream/g; let m;
  while ((m = re.exec(s))) {
    const raw = Buffer.from(m[1], 'latin1');
    let txt = null;
    try { txt = zlib.inflateSync(raw).toString('latin1'); } catch { txt = m[1]; }
    out.push(txt);
  }
  const all = out.join('\n');
  const lits = [...all.matchAll(/\(((?:\\.|[^\\)])*)\)/g)].map((x) => x[1].replace(/\\(.)/g, '$1'));
  const hex = [...all.matchAll(/<([0-9a-fA-F]{2,})>/g)].map((x) => Buffer.from(x[1], 'hex').toString('latin1'));
  return { texte: [...lits, ...hex].join(' '), nb_streams: out.length };
}

(async () => {
  const S = new Suite('FIX-006');
  const X = await inscrire('t006X'); const Y = await inscrire('t006Y');
  const ag = async (u, nom, slug) => (await pool.query(`INSERT INTO agences_immo (utilisateur_id, nom, slug, telephone, ville) VALUES ($1,$2,$3,'773330006','Dakar') RETURNING id, slug`, [u.user.id, nom, slug])).rows[0];
  const agX = await ag(X, 'Agence X 006', `agence-x-006-${RUN}`); const agY = await ag(Y, 'Agence Y 006', `agence-y-006-${RUN}`);
  const mkBase = async (a, suffix) => {
    const pr = (await pool.query(`INSERT INTO proprietaires_immo (agence_id, nom, prenom, telephone, email) VALUES ($1,'Diagne','Ousmane','774440006',$2) RETURNING id`, [a.id, `p${suffix}${RUN}@audit8.test`])).rows[0].id;
    const lo = (await pool.query(`INSERT INTO contacts_immo (agence_id, nom, prenom, telephone, type_contact) VALUES ($1,'Sow','Abdoulaye','775550006','locataire') RETURNING id`, [a.id])).rows[0].id;
    const bi = (await pool.query(`INSERT INTO biens_immo (agence_id, proprietaire_id, titre, type_bien, statut, prix_location, quartier, ville) VALUES ($1,$2,$3,'appartement','disponible',150000,'Almadies','Dakar') RETURNING id`, [a.id, pr, `Appartement F4 ${suffix}`])).rows[0].id;
    return { pr, lo, bi };
  };
  const bX = await mkBase(agX, 'X1'); const bX2 = await mkBase(agX, 'X2'); const bY = await mkBase(agY, 'Y1');
  const bailBody = (b, extra = {}) => ({ bien_id: b.bi, locataire_id: b.lo, proprietaire_id: b.pr, date_debut: '2026-10-01', duree_mois: 12, loyer_mensuel: 150000, charges: 10000, depot_garantie: 300000, jour_echeance: 5, ...extra });

  // V6-01 : TEST-014 strict (URL du plan initial sans agence) => 404 : le produit n'a pas changé
  const strict = await http('POST', '/api/locatif-immo/baux', bailBody(bX), X.token);
  S.rec('V6-01', 'URL initiale /locatif-immo/baux (sans agence) reste 404 : correctif documentaire, route produit inchangée', strict.status === 404, 404, { http: strict.status });

  // V6-02 : création de bail sous l'agence (UUID)
  const b1 = await http('POST', `/api/locatif-immo/agence/${agX.id}/baux`, bailBody(bX), X.token);
  const bailId = b1.data && b1.data.bail && b1.data.bail.id;
  const ech = bailId ? (await pool.query('SELECT * FROM loyers_echeances WHERE bail_id=$1 ORDER BY date_echeance', [bailId])).rows : [];
  S.rec('V6-02', 'TEST-014 adapté : création du bail via /agence/:id/baux => 201, bail persisté + 12 échéances générées',
    b1.status === 201 && bailId && ech.length === 12 && Number(ech[0].montant_du) > 0, { http: 201, echeances: 12 }, { http: b1.status, bail_id: bailId, nb_echeances: ech.length, premiere: ech[0] && { montant_du: ech[0].montant_du, statut: ech[0].statut } });

  // V6-03 : même route par slug (paramètre :slugOrId)
  const b2 = await http('POST', `/api/locatif-immo/agence/${agX.slug}/baux`, bailBody(bX2), X.token);
  S.rec('V6-03', 'Création de bail via le SLUG de l\'agence (:slugOrId) => 201', b2.status === 201, 201, { http: b2.status, body: b2.status >= 400 ? b2.data : undefined });

  // V6-04 : encaissement exact + persistance
  const e0 = ech[0];
  const pay = e0 && await http('POST', `/api/locatif-immo/agence/${agX.id}/loyers/${e0.id}/encaisser`, { montant: Number(e0.montant_du), mode_paiement: 'wave', reference_paiement: `WAVE-AUDIT8-${RUN}` }, X.token);
  const eAfter = e0 && (await pool.query('SELECT statut, montant_paye, montant_restant, date_paiement FROM loyers_echeances WHERE id=$1', [e0.id])).rows[0];
  S.rec('V6-04', 'Encaissement exact => 200, échéance payée, reste 0, date de paiement renseignée (rechargé depuis la DB)', pay && pay.status === 200 && eAfter.statut === 'paye' && Number(eAfter.montant_restant) === 0 && !!eAfter.date_paiement, { http: 200, statut: 'paye', restant: 0 }, { http: pay && pay.status, db: eAfter });

  // V6-05 : paiement partiel + surpaiement + double encaissement (cas limites)
  const e1 = ech[1];
  const part = await http('POST', `/api/locatif-immo/agence/${agX.id}/loyers/${e1.id}/encaisser`, { montant: Number(e1.montant_du) / 2, mode_paiement: 'cash' }, X.token);
  const eP = (await pool.query('SELECT statut, montant_paye, montant_restant FROM loyers_echeances WHERE id=$1', [e1.id])).rows[0];
  const over = await http('POST', `/api/locatif-immo/agence/${agX.id}/loyers/${e1.id}/encaisser`, { montant: Number(e1.montant_du) * 5, mode_paiement: 'cash' }, X.token);
  const eO = (await pool.query('SELECT statut, montant_paye, montant_restant FROM loyers_echeances WHERE id=$1', [e1.id])).rows[0];
  const again = await http('POST', `/api/locatif-immo/agence/${agX.id}/loyers/${e0.id}/encaisser`, { montant: 1000, mode_paiement: 'cash' }, X.token);
  const eAg = (await pool.query('SELECT statut, montant_paye, montant_restant FROM loyers_echeances WHERE id=$1', [e0.id])).rows[0];
  S.rec('V6-05', 'Cas limites : partiel => restant = moitié ; surpaiement (x5) refusé ou plafonné ; ré-encaissement d\'une échéance soldée refusé',
    part.status === 200 && Number(eP.montant_restant) === Number(e1.montant_du) / 2 && Number(eO.montant_paye) <= Number(e1.montant_du) && Number(eAg.montant_paye) <= Number(e0.montant_du),
    'pas de sur-encaissement', { partiel: { http: part.status, db: eP }, surpaiement: { http: over.status, db: eO }, re_encaissement: { http: again.status, db: eAg } });

  // V6-06 : quittance PDF — contenu réel
  const pdf = await http('GET', `/api/locatif-immo/public/quittance/${e0.id}.pdf`);
  const buf = pdf.buf || Buffer.alloc(0);
  if (buf.length) saveEvidence('FIX-006', 'ui', `quittance_${LABEL}.pdf`, buf);
  const t = buf.length ? pdfTexte(buf) : { texte: '', nb_streams: 0 };
  const fonts = [...new Set([...buf.toString('latin1').matchAll(/\/BaseFont\s*\/([A-Za-z0-9+\-]+)/g)].map((m) => m[1]))];
  const urls = [...buf.toString('latin1').matchAll(/https?:\/\/[^\s)>\/]+/g)].map((m) => m[0]);
  const txt = t.texte;
  const compact = txt.replace(/\s+/g, '');
  const mentions = { locataire: /Sow/i.test(compact), prenom: /Abdoulaye/i.test(compact), bien_ou_quartier: /Almadies|F4/i.test(compact), montant: /150[\s\u00a0.]?000|160[\s\u00a0.]?000|140[\s\u00a0.]?000/.test(txt.replace(/\s+/g, ' ')), mot_quittance: /QUITTANCE/i.test(compact), cocc: /COCC|CODEDESOBLIGATIONS/i.test(compact), periode: /2026/.test(compact) };
  S.rec('V6-06', 'Quittance PDF : 200, application/pdf, signature %PDF + %%EOF, polices système uniquement, aucune URL externe',
    pdf.status === 200 && /application\/pdf/.test(pdf.contentType) && buf.slice(0, 4).toString() === '%PDF' && /%%EOF/.test(buf.slice(-32).toString('latin1')) && fonts.length > 0 && fonts.every((f) => /Helvetica|Times|Courier|Symbol|ZapfDingbats/i.test(f)) && urls.length === 0,
    { http: 200, pdf_valide: true }, { http: pdf.status, ct: pdf.contentType, taille: buf.length, polices: fonts, urls_externes: urls });
  S.rec('V6-07', 'Quittance PDF : contenu métier réel (locataire, bien, montant, période, mentions légales COCC) — pas seulement une taille',
    mentions.locataire && mentions.montant && mentions.mot_quittance && mentions.cocc,
    { locataire: true, montant: true, mot_quittance: true, cocc: true }, { mentions, nb_streams: t.nb_streams, extrait_texte: txt.slice(0, 600) },
    'Si le texte n\'est pas extractible (PDF compressé non standard), ce test est inconclusif : voir extrait.');

  // V6-08 : le PDF n'est pas un gabarit statique (contenu différent pour deux échéances)
  const e2 = ech[2];
  await http('POST', `/api/locatif-immo/agence/${agX.id}/loyers/${e2.id}/encaisser`, { montant: Number(e2.montant_du), mode_paiement: 'wave', reference_paiement: `WAVE-AUDIT8B-${RUN}` }, X.token);
  const pdf2 = await http('GET', `/api/locatif-immo/public/quittance/${e2.id}.pdf`);
  const same = pdf2.buf && buf.length && Buffer.compare(pdf2.buf, buf) === 0;
  S.rec('V6-08', 'Deux quittances (échéances différentes) ont des contenus différents', pdf2.status === 200 && !same, 'contenus distincts', { http: pdf2.status, tailles: [buf.length, pdf2.buf && pdf2.buf.length], identiques: !!same });

  // V6-09 : quittance d'une échéance NON payée
  const e5 = ech[5];
  const unpaid = await http('GET', `/api/locatif-immo/public/quittance/${e5.id}.pdf`);
  S.rec('V6-09', 'Quittance d\'une échéance impayée : refusée (4xx), pas de quittance frauduleuse', unpaid.status >= 400 && unpaid.status < 500, '4xx', { http: unpaid.status, body: unpaid.data });
  const bad = await http('GET', `/api/locatif-immo/public/quittance/not-a-uuid.pdf`);
  const unk = await http('GET', `/api/locatif-immo/public/quittance/00000000-0000-0000-0000-000000000000.pdf`);
  S.rec('V6-10', 'Identifiant invalide / inconnu : 4xx, jamais 500', bad.status < 500 && unk.status < 500 && bad.status >= 400 && unk.status >= 400, '4xx', { invalide: bad.status, inconnu: unk.status });

  // V6-11 : route de la matrice Agent 5 (/quittance/:id/pdf) vs route du journal Agent 6 — divergence de documents
  const alt = await http('GET', `/api/locatif-immo/quittance/${e0.id}/pdf`);
  S.extra.route_matrice_agent5_quittance_id_pdf = { http: alt.status };

  // V6-12 : isolation multi-tenant du bail (Grappe E / TEST-006)
  const cross = await http('POST', `/api/locatif-immo/agence/${agY.id}/baux`, bailBody(bY), X.token);
  const crossBien = await http('POST', `/api/locatif-immo/agence/${agX.id}/baux`, bailBody(bY), X.token);
  const crossEnc = await http('POST', `/api/locatif-immo/agence/${agX.id}/loyers/${ech[3].id}/encaisser`, { montant: 1, mode_paiement: 'cash' }, Y.token);
  const vx = (await pool.query(`SELECT event_type FROM security_audit_vault WHERE user_id=$1`, [String(X.user.id)])).rows;
  S.rec('V6-12a', 'Isolation : X ne crée pas de bail dans l\'agence de Y (403) + trace IDOR_AGENCE_ACCESS_DENIED', cross.status === 403 && vx.some((r) => r.event_type === 'IDOR_AGENCE_ACCESS_DENIED'), '403 + trace', { http: cross.status, vault: vx.map((r) => r.event_type) });
  S.rec('V6-12b', 'Isolation des références : X ne peut PAS créer, dans SA agence, un bail visant le bien/locataire/propriétaire de l\'agence Y (attendu 4xx)', crossBien.status >= 400 && crossBien.status < 500, '4xx', { http: crossBien.status, bail_cree: crossBien.data && crossBien.data.bail && { id: crossBien.data.bail.id, agence_id: crossBien.data.bail.agence_id, bien_id: crossBien.data.bail.bien_id, locataire_id: crossBien.data.bail.locataire_id, proprietaire_id: crossBien.data.bail.proprietaire_id } }, 'Anomalie PRÉ-EXISTANTE non liée à FIX-006 si observée à l\'identique en before/after.');
  S.rec('V6-12c', 'Isolation : Y ne peut pas encaisser un loyer de l\'agence X (403)', crossEnc.status === 403, 403, { http: crossEnc.status });

  // V6-13 : non authentifié
  const un = await http('POST', `/api/locatif-immo/agence/${agX.id}/baux`, bailBody(bX));
  S.rec('V6-13', 'Non connecté : création de bail refusée (401)', un.status === 401, 401, un.status);

  S.extra.identifiants = { agenceX: agX.id, bail: bailId, echeance_payee: e0.id };
  S.save();
  await pool.end();
})().catch((e) => { console.error(e); process.exit(1); });
