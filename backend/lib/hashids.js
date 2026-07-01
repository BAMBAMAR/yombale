// Obfuscation des IDs numériques publics pour éviter l'énumération séquentielle
const Hashids = require('hashids/cjs');

const salt = process.env.HASHIDS_SALT || 'nopalou-default-salt-changez-moi';
const h = new Hashids(salt, 8);

function encode(id) {
  return h.encode(id);
}

function decode(hash) {
  const decoded = h.decode(hash);
  return decoded.length ? decoded[0] : null;
}

module.exports = { encode, decode };
