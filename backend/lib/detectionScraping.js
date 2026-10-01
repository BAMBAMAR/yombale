// AUD-150 : détection de l'aspiration des données. Journalise dans security_audit_vault (une fois par IP, type et heure)
// pour que l'administrateur voie qui consomme anormalement, sans bloquer personne.
const { pool } = require('../models/db');

const dejaVus = new Map();
setInterval(() => {
  const limite = Date.now() - 60 * 60 * 1000;
  for (const [k, t] of dejaVus) if (t < limite) dejaVus.delete(k);
}, 10 * 60 * 1000).unref();

// IP ayant touché un piège : leur budget de lignes est réduit comme celui d'un automate
const ipsSuspectes = new Map();
function marquerSuspecte(ip) { ipsSuspectes.set(ip, Date.now()); }
function estSuspecte(ip) {
  const t = ipsSuspectes.get(ip);
  if (!t) return false;
  if (Date.now() - t > 24 * 60 * 60 * 1000) { ipsSuspectes.delete(ip); return false; }
  return true;
}

async function signalerSecurite(req, ip, type, details = {}) {
  const cle = `${ip}|${type}`;
  if (dejaVus.has(cle)) return;
  dejaVus.set(cle, Date.now());
  try {
    await pool.query(
      `INSERT INTO security_audit_vault (event_type, ip_address, user_agent, endpoint, method, details)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
      [type, ip, String((req.headers && req.headers['user-agent']) || '').slice(0, 300),
       String((req.baseUrl || '') + (req.path || '')).slice(0, 200), req.method, JSON.stringify(details)]
    );
  } catch (err) {
    console.warn('[DETECTION] journal indisponible :', err.message);
  }
}

module.exports = { signalerSecurite, marquerSuspecte, estSuspecte };
