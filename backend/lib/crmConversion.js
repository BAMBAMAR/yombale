// backend/lib/crmConversion.js
// AUD-112 : un lead n'est « converti » que s'il a réellement été contacté avant la création de la
// boutique. Avant : tout lead dont le numéro correspondait passait à « converti », contacté ou non
// (12 leads sur 25 n'avaient reçu aucun message), ce qui rendait la conversion inattribuable.

/**
 * @param {import('pg').Pool} pool
 * @param {string} telephone numéro brut (tout format)
 * @returns {Promise<number>} nombre de leads passés à « converti »
 */
async function marquerLeadConverti(pool, telephone) {
  const norm9 = String(telephone || '').replace(/\D/g, '').slice(-9);
  if (norm9.length !== 9) return 0;

  const { rows } = await pool.query(
    `UPDATE prospection_leads l
        SET statut = 'converti', derniere_action_at = NOW(), updated_at = NOW()
      WHERE RIGHT(REGEXP_REPLACE(COALESCE(l.telephone, ''), '[^0-9]', '', 'g'), 9) = $1
        AND l.statut <> 'converti'
        AND EXISTS (
          SELECT 1 FROM prospection_messages_log m
           WHERE m.lead_id = l.id AND m.statut IN ('envoye', 'livre', 'lu')
        )
    RETURNING l.id`,
    [norm9]
  );

  for (const r of rows) {
    await pool.query(
      `INSERT INTO prospection_lead_events (lead_id, type_evenement, canal, description)
       VALUES ($1, 'boutique_creee', 'web', 'Boutique créée après contact de prospection')`,
      [r.id]
    ).catch(() => {});
  }
  return rows.length;
}

module.exports = { marquerLeadConverti };
