const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Pool } = require('pg');

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:4100';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const secret = process.env.WHATSAPP_APP_SECRET || 'audit-disabled';

function saveProof(filename, data) {
  const dir04 = path.join(__dirname, '../../../audit/04_RESULTATS/PREUVES');
  const dir03 = path.join(__dirname, '../../../audit/03_PREUVES');
  fs.mkdirSync(dir04, { recursive: true });
  fs.mkdirSync(dir03, { recursive: true });
  fs.writeFileSync(path.join(dir04, filename), JSON.stringify(data, null, 2));
  fs.writeFileSync(path.join(dir03, filename.replace('TEST-', 'PREUVE-TEST-')), JSON.stringify(data, null, 2));
}

async function run() {
  console.log('=== DÉBUT EXÉCUTION SECTION 6 (TEST-013) ===');

  const testMessageId = `wamid.HBgLMjIxNzcxMjM0NTY3FQIAERgS${Date.now()}TEST13`;
  console.log(`Message ID de test : ${testMessageId}`);

  // Nettoyage préalable si présent
  await pool.query('DELETE FROM whatsapp_processed_messages WHERE message_id = $1', [testMessageId]);

  const payload = {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: '100000000000001',
        changes: [
          {
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '221770000000',
                phone_number_id: '100000000000002'
              },
              contacts: [
                {
                  profile: { name: 'Client Test Webhook' },
                  wa_id: '221771234567'
                }
              ],
              messages: [
                {
                  from: '221771234567',
                  id: testMessageId,
                  timestamp: String(Math.floor(Date.now() / 1000)),
                  text: { body: 'Bonjour Nopalou' },
                  type: 'text'
                }
              ]
            },
            field: 'messages'
          }
        ]
      }
    ]
  };

  const rawBody = JSON.stringify(payload);
  const signature = 'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

  // 1. Premier appel
  const tStart1 = Date.now();
  const res1 = await fetch(`${BASE_URL}/api/whatsapp/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hub-signature-256': signature
    },
    body: rawBody
  });
  const tDuration1 = Date.now() - tStart1;

  // Laisser 1 seconde au handler asynchrone pour insérer en base
  await new Promise(r => setTimeout(r, 1200));

  const dbCheck1 = await pool.query(
    'SELECT message_id, processed_at FROM whatsapp_processed_messages WHERE message_id = $1',
    [testMessageId]
  );

  // 2. Deuxième appel identique (simulation rejeu Meta)
  const tStart2 = Date.now();
  const res2 = await fetch(`${BASE_URL}/api/whatsapp/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hub-signature-256': signature
    },
    body: rawBody
  });
  const tDuration2 = Date.now() - tStart2;

  await new Promise(r => setTimeout(r, 800));

  const dbCheck2 = await pool.query(
    'SELECT message_id, processed_at FROM whatsapp_processed_messages WHERE message_id = $1',
    [testMessageId]
  );

  const t13Pass =
    res1.status === 200 &&
    tDuration1 < 1000 &&
    dbCheck1.rows.length === 1 &&
    res2.status === 200 &&
    tDuration2 < 1000 &&
    dbCheck2.rows.length === 1;

  const result = {
    status: t13Pass ? 'PASS' : 'FAIL',
    observed: {
      first_call: {
        status: res1.status,
        duration_ms: tDuration1,
        processed_in_db: dbCheck1.rows[0]
      },
      second_call_replay: {
        status: res2.status,
        duration_ms: tDuration2,
        total_rows_in_db: dbCheck2.rows.length
      }
    }
  };

  saveProof('TEST-013_preuve-01.json', result);
  console.log(`\nTEST-013 Statut : ${result.status}`);

  await pool.end();
}

run().catch(err => {
  console.error('Erreur section 6:', err);
  process.exit(1);
});
