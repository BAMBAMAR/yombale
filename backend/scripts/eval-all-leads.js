const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { pool } = require('../models/db');
const { normaliserTelephoneSenegal, estLeadEmploiOuInvalide, estNomPropreAuthentique } = require('../services/prospection');

async function evalAll() {
  try {
    const { rows: leads } = await pool.query(`SELECT * FROM prospection_leads ORDER BY created_at DESC`);

    let stats = {
      total: leads.length,
      vrai_commercant: 0,
      faux_positif_emploi: 0,
      particulier_ou_generique: 0,
      nom_authentique: 0,
      nom_generique: 0,
      nom_pollue: 0,
      tel_valide_senegal: 0,
      tel_invalide: 0,
      with_contact_nom: 0,
      with_email: 0,
      hot_recent: 0, // <= 3j
      actif: 0,      // 4-14j
      ancien: 0,     // 15-30j
      obsolete: 0,   // > 30j
      fit_score_eleve: 0, // >= 65
      fit_score_moyen: 0, // 35-64
      fit_score_faible: 0, // < 35
      nouveaux: 0,
      contactes: 0,
      convertis: 0,
      invalides_db: 0,
      desinscrits_db: 0,
    };

    const sourceBreakdown = {};
    const catBreakdown = {};

    const now = new Date('2026-09-07T18:24:57Z');

    for (const lead of leads) {
      const telNorm = normaliserTelephoneSenegal(lead.telephone);
      const isEmploi = estLeadEmploiOuInvalide(lead);
      const isNomAuth = estNomPropreAuthentique(lead.nom_boutique);
      const isGeneric = ['mode', 'véhicules', 'immobilière', 'commerce général', 'téléphonie & tech', 'électroménager', 'alimentation & supérette', 'commerce & boutique', 'emploi', 'de livraison', 'services', '& ameublement'].includes((lead.nom_boutique || '').toLowerCase());

      // Date check
      const leadDate = new Date(lead.created_at);
      const diffDays = (now - leadDate) / (1000 * 3600 * 24);

      let fraicheur = 'ANCIEN';
      if (diffDays <= 3) fraicheur = 'HOT';
      else if (diffDays <= 14) fraicheur = 'ACTIF';
      else if (diffDays <= 30) fraicheur = 'ANCIEN';
      else fraicheur = 'OBSOLETE';

      // Nopalou Fit Score (/100)
      let fitScore = 0;
      if (['mode', 'smartphones', 'tech', 'beaute', 'superette', 'alimentation'].includes(lead.categorie)) fitScore += 35;
      else if (['maison', 'tv-electro', 'grossiste'].includes(lead.categorie)) fitScore += 25;
      else if (['auto-moto', 'immo'].includes(lead.categorie)) fitScore += 15;
      else fitScore += 10;

      if (isNomAuth) fitScore += 25;
      else if (!isGeneric) fitScore += 10;

      if (['Orange', 'Free (Yas)', 'Expresso'].includes(telNorm.operateur)) fitScore += 20;

      if (fraicheur === 'HOT') fitScore += 20;
      else if (fraicheur === 'ACTIF') fitScore += 15;
      else if (fraicheur === 'ANCIEN') fitScore += 5;

      if (isEmploi) fitScore = 0;
      if (isGeneric) fitScore = Math.max(0, fitScore - 20);

      // Counters
      if (lead.statut === 'nouveau') stats.nouveaux++;
      else if (lead.statut && lead.statut.startsWith('contacte')) stats.contactes++;
      else if (lead.statut === 'converti') stats.convertis++;
      else if (lead.statut === 'invalide') stats.invalides_db++;
      else if (lead.statut === 'desinscrit') stats.desinscrits_db++;

      if (isEmploi) stats.faux_positif_emploi++;
      else if (isGeneric) stats.particulier_ou_generique++;
      else stats.vrai_commercant++;

      if (isNomAuth) stats.nom_authentique++;
      else if (isGeneric) stats.nom_generique++;
      else stats.nom_pollue++;

      if (telNorm.valide) stats.tel_valide_senegal++;
      else stats.tel_invalide++;

      if (lead.contact_nom) stats.with_contact_nom++;
      if (lead.email) stats.with_email++;

      if (fraicheur === 'HOT') stats.hot_recent++;
      else if (fraicheur === 'ACTIF') stats.actif++;
      else if (fraicheur === 'ANCIEN') stats.ancien++;
      else stats.obsolete++;

      if (fitScore >= 65) stats.fit_score_eleve++;
      else if (fitScore >= 35) stats.fit_score_moyen++;
      else stats.fit_score_faible++;

      // Source breakdown
      const src = lead.source || 'inconnu';
      if (!sourceBreakdown[src]) {
        sourceBreakdown[src] = { total: 0, vrais_prospects: 0, faux_positifs: 0, generiques: 0, contactes: 0, convertis: 0 };
      }
      sourceBreakdown[src].total++;
      if (isEmploi) sourceBreakdown[src].faux_positifs++;
      else if (isGeneric) sourceBreakdown[src].generiques++;
      else sourceBreakdown[src].vrais_prospects++;
      if (lead.statut && lead.statut.startsWith('contacte')) sourceBreakdown[src].contactes++;
      if (lead.statut === 'converti') sourceBreakdown[src].convertis++;

      // Category breakdown
      const cat = lead.categorie || 'non_classe';
      if (!catBreakdown[cat]) {
        catBreakdown[cat] = { total: 0, vrais: 0, generiques: 0, contactes: 0 };
      }
      catBreakdown[cat].total++;
      if (isNomAuth) catBreakdown[cat].vrais++;
      else catBreakdown[cat].generiques++;
      if (lead.statut && lead.statut.startsWith('contacte')) catBreakdown[cat].contactes++;
    }

    console.log('=== AUDIT GLOBAL DES 847 LEADS ===');
    console.table(stats);

    const outPath = path.join(__dirname, 'all-leads-analysis.json');
    fs.writeFileSync(outPath, JSON.stringify({ stats, sourceBreakdown, catBreakdown }, null, 2), 'utf-8');
    console.log('Fichier exporté dans:', outPath);

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

evalAll();
