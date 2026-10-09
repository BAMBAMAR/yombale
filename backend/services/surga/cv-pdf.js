// backend/services/surga/cv-pdf.js
// Mise en page du CV en PDF (pdfkit). Deux modèles réellement distincts :
//  - sobre_moderne : colonne latérale foncée (contact, compétences, langues) et colonne principale (profil, parcours) ;
//  - classique_pro : une colonne, en-tête centré, rubriques soulignées.
// Règle Surga : aucune donnée inventée. Seules les informations saisies par la personne sont écrites, une rubrique
// vide n'apparaît pas, aucun niveau ni aucune note n'est ajouté. La pagination est gérée ici : le texte n'est jamais
// posé sous la marge basse, et une rubrique ne laisse pas son titre seul en bas de page.

const C = {
  navy: '#1C2B4A',
  accent: '#C75B00',
  texte: '#0F172A',
  gris: '#475569',
  filet: '#CBD5E1',
  clair: '#E2E8F0',
  surLatérale: '#F8FAFC',
  surLatéraleDouce: '#94A3B8',
};
const PAGE = { w: 595.28, h: 841.89, haut: 44, bas: 796 };

const lignesDe = (texte) =>
  String(texte || '')
    .split('\n')
    .map((l) => l.replace(/^\s*[-•*–]\s*/, '').trim())
    .filter(Boolean);

const periodeDe = (e) => [e.date_debut, e.date_fin || (e.en_cours ? 'Présent' : '')].filter(Boolean).join(' – ');

const initialesDe = (nom) => {
  const mots = String(nom || '').split(/\s+/).filter(Boolean);
  if (!mots.length) return '';
  return (mots[0][0] + (mots.length > 1 ? mots[mots.length - 1][0] : '')).toUpperCase();
};

function normaliser(donnees, nettoyer) {
  const t = (v) => nettoyer(v == null ? '' : String(v));
  const competences = (Array.isArray(donnees.competences) ? donnees.competences : [])
    .map((c) => t(typeof c === 'string' ? c : c && c.nom))
    .filter(Boolean);
  const langues = (Array.isArray(donnees.langues) ? donnees.langues : [])
    .map((l) => (typeof l === 'string' ? { langue: t(l), niveau: '' } : { langue: t(l && l.langue), niveau: t(l && l.niveau) }))
    .filter((l) => l.langue);
  const experiences = (Array.isArray(donnees.experiences) ? donnees.experiences : [])
    .map((e) => ({
      poste: t(e.titre || e.poste),
      entreprise: t(e.entreprise),
      lieu: t(e.lieu),
      periode: periodeDe(e),
      puces: lignesDe(t(e.description)),
    }))
    .filter((e) => e.poste || e.entreprise);
  const formations = (Array.isArray(donnees.formations) ? donnees.formations : [])
    .map((f) => ({
      diplome: t(f.diplome || f.titre),
      etablissement: t(f.etablissement || f.ecole),
      annee: t(f.annee || f.date),
      puces: lignesDe(t(f.description)),
    }))
    .filter((f) => f.diplome || f.etablissement);
  return {
    nom: t(donnees.nom_complet) || 'Curriculum vitae',
    titre: t(donnees.titre_professionnel || donnees.titre_poste),
    telephone: t(donnees.telephone),
    email: t(donnees.email),
    ville: t(donnees.adresse_ville || donnees.adresse),
    resume: t(donnees.resume_pro || donnees.resume),
    competences,
    langues,
    experiences,
    formations,
  };
}

// Petit outil de pose : tient la position verticale et change de page quand il le faut.
function pose(doc, { x, w, apresNouvellePage }) {
  const etat = { y: PAGE.haut };
  const texte = (t, opt = {}) => {
    const { font = 'Helvetica', size = 9.5, color = C.texte, align = 'left', gap = 1.5, dx = 0, width = w - dx, espaceApres = 0 } = opt;
    doc.font(font).fontSize(size);
    const h = doc.heightOfString(t, { width, align, lineGap: gap });
    if (etat.y + h > PAGE.bas) nouvellePage();
    doc.fillColor(color).text(t, x + dx, etat.y, { width, align, lineGap: gap, characterSpacing: opt.espacement || 0 });
    etat.y += h + espaceApres;
    return h;
  };
  const nouvellePage = () => {
    // Marges nulles aussi sur les pages suivantes : avec la marge par défaut, la mention du pied déclenchait une page vide.
    doc.addPage({ size: 'A4', margins: { top: 0, left: 0, right: 0, bottom: 0 } });
    doc.page.margins = { top: 0, left: 0, right: 0, bottom: 0 };
    etat.y = PAGE.haut;
    if (apresNouvellePage) apresNouvellePage();
  };
  // Réserve de la place pour un bloc d'une hauteur donnée (titre + début de contenu) : sinon page suivante.
  const reserver = (h) => { if (etat.y + h > PAGE.bas) nouvellePage(); };
  return { etat, texte, reserver, nouvellePage };
}

function puces(p, lignes, { dx = 0, size = 9.3 } = {}) {
  if (!lignes.length) return;
  const { doc } = p;
  if (lignes.length === 1) {
    p.texte(lignes[0], { size, color: C.texte, dx, espaceApres: 3 });
    return;
  }
  for (const l of lignes) {
    doc.font('Helvetica').fontSize(size);
    const h = doc.heightOfString(l, { width: p.largeur - dx - 10, lineGap: 1.5 });
    p.reserver(h);
    doc.fillColor(C.accent).text('•', p.x + dx, p.etat.y, { width: 8, lineBreak: false });
    doc.fillColor(C.texte).text(l, p.x + dx + 10, p.etat.y, { width: p.largeur - dx - 10, lineGap: 1.5 });
    p.etat.y += h + 2.2;
  }
  p.etat.y += 2;
}

// ───────────────────────── Modèle « sobre_moderne » ─────────────────────────
function dessinerModerne(doc, d, avecMention) {
  const LAT = 188; // largeur de la colonne latérale
  const X = LAT + 28;
  const W = PAGE.w - X - 34;

  const fondLateral = () => { doc.save().rect(0, 0, LAT, PAGE.h).fill(C.navy).restore(); };
  fondLateral();
  doc.on('pageAdded', fondLateral);

  // Colonne latérale (première page)
  const lat = pose(doc, { x: 22, w: LAT - 44 });
  lat.etat.y = PAGE.haut;
  const ini = initialesDe(d.nom);
  if (ini) {
    doc.save().circle(22 + 31, lat.etat.y + 31, 31).fill(C.accent).restore();
    doc.font('Helvetica-Bold').fontSize(22).fillColor('#FFFFFF').text(ini, 22, lat.etat.y + 22, { width: 62, align: 'center' });
    lat.etat.y += 84;
  }
  const titreLat = (t) => {
    lat.reserver(28);
    lat.texte(t.toUpperCase(), { font: 'Helvetica-Bold', size: 9, color: '#FFFFFF', espacement: 1.1, espaceApres: 3 });
    doc.save().rect(22, lat.etat.y, 22, 2).fill(C.accent).restore();
    lat.etat.y += 9;
  };
  const contacts = [['Téléphone', d.telephone], ['E-mail', d.email], ['Ville', d.ville]].filter(([, v]) => v);
  if (contacts.length) {
    titreLat('Contact');
    for (const [lib, val] of contacts) {
      lat.texte(lib, { size: 7.5, color: C.surLatéraleDouce, espaceApres: 0.5 });
      lat.texte(val, { size: 9, color: C.surLatérale, espaceApres: 7, width: LAT - 44 });
    }
    lat.etat.y += 6;
  }
  if (d.competences.length) {
    titreLat('Compétences');
    for (const c of d.competences) {
      doc.save().rect(22, lat.etat.y + 3.4, 3.2, 3.2).fill(C.accent).restore();
      lat.texte(c, { size: 9, color: C.surLatérale, dx: 11, espaceApres: 3.5 });
    }
    lat.etat.y += 8;
  }
  if (d.langues.length) {
    titreLat('Langues');
    for (const l of d.langues) {
      lat.texte(l.langue, { font: 'Helvetica-Bold', size: 9, color: C.surLatérale, espaceApres: l.niveau ? 0.5 : 5 });
      if (l.niveau) lat.texte(l.niveau, { size: 8, color: C.surLatéraleDouce, espaceApres: 5.5 });
    }
  }

  // Colonne principale
  const piedMention = () => {
    if (!avecMention) return;
    doc.font('Helvetica').fontSize(7.5).fillColor('#94A3B8').text('Conçu avec Surga • Assistant personnel du Sénégal', X, PAGE.h - 34, { width: W, align: 'right', lineBreak: false });
  };
  const p = pose(doc, { x: X, w: W, apresNouvellePage: piedMention });
  p.doc = doc; p.x = X; p.largeur = W;
  piedMention();

  p.texte(d.nom, { font: 'Helvetica-Bold', size: 25, color: C.navy, gap: 0, espaceApres: 3 });
  if (d.titre) p.texte(d.titre.toUpperCase(), { font: 'Helvetica-Bold', size: 10.5, color: C.accent, espacement: 1.2, espaceApres: 10 });
  doc.save().moveTo(X, p.etat.y).lineTo(X + W, p.etat.y).lineWidth(0.8).strokeColor(C.filet).stroke().restore();
  p.etat.y += 14;

  const rubrique = (titre) => {
    p.reserver(56);
    p.texte(titre.toUpperCase(), { font: 'Helvetica-Bold', size: 10.5, color: C.navy, espacement: 1, espaceApres: 3 });
    doc.save().rect(X, p.etat.y, 26, 2.4).fill(C.accent).restore();
    doc.save().moveTo(X + 32, p.etat.y + 1.2).lineTo(X + W, p.etat.y + 1.2).lineWidth(0.6).strokeColor(C.clair).stroke().restore();
    p.etat.y += 11;
  };

  if (d.resume) {
    rubrique('Profil');
    p.texte(d.resume, { size: 9.6, gap: 2.2, color: C.texte, espaceApres: 14 });
  }
  if (d.experiences.length) {
    rubrique('Expériences professionnelles');
    for (const e of d.experiences) {
      p.reserver(48);
      const yDebut = p.etat.y;
      if (e.periode) doc.font('Helvetica').fontSize(8.5).fillColor(C.gris).text(e.periode, X + W - 105, yDebut + 1.5, { width: 105, align: 'right', lineBreak: false });
      p.texte(e.poste || e.entreprise, { font: 'Helvetica-Bold', size: 10.5, color: C.navy, width: W - (e.periode ? 112 : 0), espaceApres: 1 });
      const sous = [e.poste ? e.entreprise : '', e.lieu].filter(Boolean).join('  •  ');
      if (sous) p.texte(sous, { font: 'Helvetica-Oblique', size: 9, color: C.gris, espaceApres: 3.5 });
      puces(p, e.puces);
      p.etat.y += 7;
    }
    p.etat.y += 3;
  }
  if (d.formations.length) {
    rubrique('Formations et diplômes');
    for (const f of d.formations) {
      p.reserver(40);
      const yDebut = p.etat.y;
      if (f.annee) doc.font('Helvetica').fontSize(8.5).fillColor(C.gris).text(f.annee, X + W - 105, yDebut + 1.5, { width: 105, align: 'right', lineBreak: false });
      p.texte(f.diplome || f.etablissement, { font: 'Helvetica-Bold', size: 10.2, color: C.navy, width: W - (f.annee ? 112 : 0), espaceApres: 1 });
      if (f.diplome && f.etablissement) p.texte(f.etablissement, { font: 'Helvetica-Oblique', size: 9, color: C.gris, espaceApres: 3 });
      puces(p, f.puces);
      p.etat.y += 6;
    }
  }
}

// ───────────────────────── Modèle « classique_pro » ─────────────────────────
function dessinerClassique(doc, d, avecMention) {
  const X = 50;
  const W = PAGE.w - 2 * X;
  const piedMention = () => {
    if (!avecMention) return;
    doc.font('Helvetica').fontSize(7.5).fillColor('#94A3B8').text('Conçu avec Surga • Assistant personnel du Sénégal', X, PAGE.h - 34, { width: W, align: 'center', lineBreak: false });
  };
  const p = pose(doc, { x: X, w: W, apresNouvellePage: piedMention });
  p.doc = doc; p.x = X; p.largeur = W;
  piedMention();

  p.texte(d.nom, { font: 'Helvetica-Bold', size: 24, color: C.navy, align: 'center', gap: 0, espaceApres: 4 });
  if (d.titre) p.texte(d.titre.toUpperCase(), { font: 'Helvetica-Bold', size: 10.5, color: C.accent, align: 'center', espacement: 1.3, espaceApres: 6 });
  const coords = [d.telephone, d.email, d.ville].filter(Boolean).join('   |   ');
  if (coords) p.texte(coords, { size: 9, color: C.gris, align: 'center', espaceApres: 8 });
  doc.save().moveTo(X, p.etat.y).lineTo(X + W, p.etat.y).lineWidth(1.4).strokeColor(C.navy).stroke().restore();
  doc.save().moveTo(X, p.etat.y + 3).lineTo(X + W, p.etat.y + 3).lineWidth(0.5).strokeColor(C.filet).stroke().restore();
  p.etat.y += 16;

  const rubrique = (titre) => {
    p.reserver(56);
    p.texte(titre.toUpperCase(), { font: 'Helvetica-Bold', size: 10.5, color: C.navy, espacement: 1, espaceApres: 2 });
    doc.save().moveTo(X, p.etat.y).lineTo(X + W, p.etat.y).lineWidth(0.7).strokeColor(C.navy).stroke().restore();
    p.etat.y += 8;
  };

  if (d.resume) {
    rubrique('Profil');
    p.texte(d.resume, { size: 9.8, gap: 2.3, align: 'justify', espaceApres: 14 });
  }
  if (d.experiences.length) {
    rubrique('Expériences professionnelles');
    for (const e of d.experiences) {
      p.reserver(46);
      const yDebut = p.etat.y;
      if (e.periode) doc.font('Helvetica-Bold').fontSize(9).fillColor(C.gris).text(e.periode, X + W - 110, yDebut + 1.5, { width: 110, align: 'right', lineBreak: false });
      p.texte(e.poste || e.entreprise, { font: 'Helvetica-Bold', size: 10.5, color: C.texte, width: W - (e.periode ? 118 : 0), espaceApres: 1 });
      const sous = [e.poste ? e.entreprise : '', e.lieu].filter(Boolean).join(', ');
      if (sous) p.texte(sous, { font: 'Helvetica-Oblique', size: 9.3, color: C.gris, espaceApres: 3.5 });
      puces(p, e.puces, { dx: 4 });
      p.etat.y += 6;
    }
    p.etat.y += 4;
  }
  if (d.formations.length) {
    rubrique('Formations et diplômes');
    for (const f of d.formations) {
      p.reserver(38);
      const yDebut = p.etat.y;
      if (f.annee) doc.font('Helvetica-Bold').fontSize(9).fillColor(C.gris).text(f.annee, X + W - 110, yDebut + 1.5, { width: 110, align: 'right', lineBreak: false });
      p.texte(f.diplome || f.etablissement, { font: 'Helvetica-Bold', size: 10.2, color: C.texte, width: W - (f.annee ? 118 : 0), espaceApres: 1 });
      if (f.diplome && f.etablissement) p.texte(f.etablissement, { font: 'Helvetica-Oblique', size: 9.3, color: C.gris, espaceApres: 3 });
      puces(p, f.puces, { dx: 4 });
      p.etat.y += 5;
    }
    p.etat.y += 4;
  }
  if (d.competences.length) {
    rubrique('Compétences');
    p.texte(d.competences.join('   •   '), { size: 9.6, gap: 3, espaceApres: 12 });
  }
  if (d.langues.length) {
    rubrique('Langues');
    p.texte(d.langues.map((l) => (l.niveau ? `${l.langue} (${l.niveau})` : l.langue)).join('   •   '), { size: 9.6, gap: 3, espaceApres: 6 });
  }
}

function dessinerCv(doc, donnees, { modele = 'sobre_moderne', avecMention = false } = {}, nettoyer = (s) => s) {
  const d = normaliser(donnees || {}, nettoyer);
  // La pagination est tenue ici : sans marge, pdfkit n'ajoute jamais de page de lui-même (la mention du bas en
  // créait une seconde, vide).
  const marges = { top: 0, left: 0, right: 0, bottom: 0 };
  doc.options.margins = marges;
  doc.page.margins = { ...marges };
  if (modele === 'classique_pro') dessinerClassique(doc, d, avecMention);
  else dessinerModerne(doc, d, avecMention);
}

module.exports = { dessinerCv, normaliser, lignesDe, periodeDe, initialesDe };
