require('dotenv').config({ path: './.env' });
const { pool, ensureProspectionTables, nettoyerTousLesLeadsBdd, analyserToutesLesCampagnes, recommanderProchaineCampagne } = require('../services/prospection');

async function main() {
  try {
    console.log('1. Initialisation tables et colonnes...');
    await ensureProspectionTables();
    console.log('   -> Tables et colonnes migrées avec succès.');

    console.log('2. Recalcul et scoring des leads existants...');
    const resNettoyage = await nettoyerTousLesLeadsBdd();
    console.log('   -> Résultat:', resNettoyage);

    console.log('3. Diagnostic de toutes les campagnes passées...');
    const macro = await analyserToutesLesCampagnes();
    console.log('   -> Campagnes analysées:', macro.campagnes_analysees.length);
    const alertes = macro.campagnes_analysees.flatMap(c => (c.alertes || []).map(a => ({ ...a, campagne: c.titre })));
    console.log('   -> Alertes détectées:', alertes.length);
    alertes.slice(0, 8).forEach(a => console.log(`      * [${a.severite || 'info'}] ${a.campagne}: ${a.titre} -> ${a.detail}`));

    console.log('4. Top Segments & Taux de Conversion...');
    console.log('   -> Segments:', JSON.stringify(macro.top_segments, null, 2));

    console.log('5. Recommandation automatique de la prochaine campagne...');
    const rec = await recommanderProchaineCampagne();
    console.log('   -> Segment recommandé:', rec.segment_recommande);
    console.log('   -> Zone ciblée:', rec.zone);
    console.log('   -> Template:', rec.template_titre);
    console.log('   -> Taille lot:', rec.taille_lot_recommandee);
    console.log('   -> Prospects prioritaires disponibles:', rec.prospects_prioritaires.length);
    if (rec.prospects_prioritaires.length > 0) {
      console.log('   -> Top 3 prospects:');
      rec.prospects_prioritaires.slice(0, 3).forEach((p, idx) => {
        console.log(`      ${idx+1}. ${p.nom_boutique} (${p.contact_nom || 'Inconnu'}) - Score: ${p.priority_score}/100 - Action: ${p.next_best_action}`);
      });
    }

    process.exit(0);
  } catch (err) {
    console.error('Erreur lors de l\'exécution:', err);
    process.exit(1);
  }
}

main();
