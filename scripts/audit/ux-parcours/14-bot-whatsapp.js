// Scénarios UX du chatbot WhatsApp (vrai code, base locale, envois Meta capturés) avec un numéro de test.
// Usage (après audit-env, NODE_OPTIONS vidé) : node scripts/audit/ux-parcours/14-bot-whatsapp.js <numero>
const { dire, texte, pool } = require('../offline/bot-harness');
const tel = process.argv[2] || '221770000009';
(async () => {
  const etapes = ['salam', 'Je cherche un iPhone', 'iphone 13 moins de 200000', 'Je veux une location aux Almadies', 'suivre ma commande C-MUR0MZMR70C8', 'je veux créer une boutique', 'Sama xaalis', 'asdfgh'];
  for (const m of etapes) await dire(tel, texte(m), m);
  await pool.end();
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
