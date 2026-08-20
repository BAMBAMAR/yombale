const { pool } = require('../models/db');

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sans 0/O/1/I pour éviter toute confusion

function genererCode() {
  let code = '';
  for (let i = 0; i < 6; i++) code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return code;
}

async function genererCodeUnique() {
  for (let tentative = 0; tentative < 15; tentative++) {
    const code = genererCode();
    const { rows } = await pool.query('SELECT id FROM utilisateurs WHERE code_apporteur=$1', [code]);
    if (!rows[0]) return code;
  }
  throw new Error('Impossible de générer un code apporteur unique');
}

module.exports = { genererCode, genererCodeUnique };
