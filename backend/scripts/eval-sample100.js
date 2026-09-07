const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { pool } = require('../models/db');
const { normaliserTelephoneSenegal, estLeadEmploiOuInvalide, estNomPropreAuthentique } = require('../services/prospection');

async function evalSample() {
  try {
    const { rows: leads } = await pool.query(`
      SELECT *
      FROM prospection_leads
      ORDER BY id
      LIMIT 100
    `);

    let stats = {
      total: leads.length,
      vrai_commercant: 0,
      faux_positif_emploi: 0,
      faux_positif_particulier_ou_agg: 0,
      nom_authentique: 0,
      nom_generique: 0,
      nom_pollue: 0,
      tel_valide_senegal: 0,
      senegal_localise: 0,
      with_contact_nom: 0,
      hot_recent: 0,
      actif: 0,
      ancien: 0,
      fit_score_eleve: 0, // >= 70
      fit_score_moyen: 0, // 40-69
      fit_score_faible: 0, // < 40
    };

    const details = [];

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

      // Senegal Confidence Score (/100)
      let senegalScore = 0;
      if (telNorm.valide) senegalScore += 40;
      if (['Orange', 'Free (Yas)', 'Expresso', 'Promobile'].includes(telNorm.operateur)) senegalScore += 20;
      if (lead.ville && ['dakar', 'thiès', 'mbour', 'touba', 'saint-louis', 'ziguinchor', 'kaolack'].includes(lead.ville.toLowerCase())) senegalScore += 20;
      if (lead.quartier && lead.quartier !== 'Dakar' && lead.quartier !== 'Tout Dakar & Régions') senegalScore += 20;

      // Nopalou Fit Score (/100)
      // Mesure l'adéquation avec une boutique en ligne / catalogue WhatsApp / POS
      let fitScore = 0;
      // Catégorie porteuse pour boutique WhatsApp
      if (['mode', 'smartphones', 'tech', 'beaute', 'superette', 'alimentation'].includes(lead.categorie)) fitScore += 35;
      else if (['maison', 'tv-electro', 'grossiste'].includes(lead.categorie)) fitScore += 25;
      else if (['auto-moto', 'immo'].includes(lead.categorie)) fitScore += 15; // Immo / auto: vitrine, mais pas de vente directe panier
      else fitScore += 10;

      // Nom authentique = commerce identifié
      if (isNomAuth) fitScore += 25;
      else if (!isGeneric) fitScore += 10;

      // Contactabilité mobile WhatsApp
      if (['Orange', 'Free (Yas)', 'Expresso'].includes(telNorm.operateur)) fitScore += 20;

      // Fraîcheur
      if (fraicheur === 'HOT') fitScore += 20;
      else if (fraicheur === 'ACTIF') fitScore += 15;
      else fitScore += 5;

      // Pénalités
      if (isEmploi) fitScore = 0;
      if (isGeneric) fitScore = Math.max(0, fitScore - 20);

      // Stat counting
      if (isEmploi) {
        stats.faux_positif_emploi++;
      } else if (isGeneric && !lead.contact_nom) {
        stats.faux_positif_particulier_ou_agg++;
      } else {
        stats.vrai_commercant++;
      }

      if (isNomAuth) stats.nom_authentique++;
      else if (isGeneric) stats.nom_generique++;
      else stats.nom_pollue++;

      if (telNorm.valide) stats.tel_valide_senegal++;
      if (senegalScore >= 60) stats.senegal_localise++;
      if (lead.contact_nom) stats.with_contact_nom++;

      if (fraicheur === 'HOT') stats.hot_recent++;
      else if (fraicheur === 'ACTIF') stats.actif++;
      else stats.ancien++;

      if (fitScore >= 65) stats.fit_score_eleve++;
      else if (fitScore >= 35) stats.fit_score_moyen++;
      else stats.fit_score_faible++;

      details.push({
        id: lead.id,
        nom: lead.nom_boutique,
        contact: lead.contact_nom,
        tel: lead.telephone,
        operateur: telNorm.operateur,
        cat: lead.categorie,
        quartier: lead.quartier,
        source: lead.source,
        statut: lead.statut,
        fraicheur,
        senegalScore,
        fitScore,
        isEmploi,
        isGeneric
      });
    }

    console.log('=== RÉSULTATS AUDIT ÉCHANTILLON 100 LEADS ===');
    console.table(stats);

    const outPath = path.join(__dirname, 'sample100-analysis.json');
    fs.writeFileSync(outPath, JSON.stringify({ stats, details }, null, 2), 'utf-8');
    console.log('Détails enregistrés dans:', outPath);

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

evalSample();
