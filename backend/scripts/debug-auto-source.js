const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { pool } = require('../models/db');
const { autoSourcerDepuisAnnonces } = require('../services/prospection');

async function debug() {
  console.log('Testing autoSourcerDepuisAnnonces...');
  const start = Date.now();
  try {
    const res = await autoSourcerDepuisAnnonces();
    console.log('SUCCESS in', Date.now() - start, 'ms:', res);
  } catch (err) {
    console.error('FAILED in', Date.now() - start, 'ms:');
    console.error(err.message);
    console.error(err.stack);
  } finally {
    await pool.end();
  }
}

debug();
