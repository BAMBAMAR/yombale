// backend/lib/safeFetch.js
// AUD-026 : requêtes sortantes vers des URL fournies par un utilisateur, protégées contre le SSRF.
// - seuls http/https, ports 80/443, sans identifiants dans l'URL ;
// - toute adresse résolue (IPv4 et IPv6) doit être publique, contrôle fait au moment de la connexion
//   (fournisseur `lookup` de l'agent), ce qui ferme aussi la fenêtre de DNS rebinding ;
// - les redirections sont suivies à la main et revalidées à chaque saut ;
// - taille de réponse et durée bornées.
const dns = require('dns');
const net = require('net');
const http = require('http');
const https = require('https');
const axios = require('axios');

const blocked = new net.BlockList();
const V4 = [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8], ['169.254.0.0', 16],
  ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.0.2.0', 24], ['192.88.99.0', 24], ['192.168.0.0', 16],
  ['198.18.0.0', 15], ['198.51.100.0', 24], ['203.0.113.0', 24], ['224.0.0.0', 4], ['240.0.0.0', 4],
];
const V6 = [
  ['::', 128], ['::1', 128], ['64:ff9b::', 96], ['100::', 64], ['2001:db8::', 32],
  ['fc00::', 7], ['fe80::', 10], ['fec0::', 10], ['ff00::', 8],
];
V4.forEach(([a, p]) => blocked.addSubnet(a, p, 'ipv4'));
V6.forEach(([a, p]) => blocked.addSubnet(a, p, 'ipv6'));

function stripBrackets(host) {
  return host.startsWith('[') && host.endsWith(']') ? host.slice(1, -1) : host;
}

/** true si l'adresse IP (littérale) est privée, réservée, locale ou invalide. */
function isBlockedAddress(address) {
  const ip = stripBrackets(String(address || '')).split('%')[0];
  const family = net.isIP(ip);
  if (!family) return true;
  // Les adresses IPv4 mappées en IPv6 (::ffff:a.b.c.d) sont contrôlées comme de l'IPv4.
  return blocked.check(ip, family === 6 ? 'ipv6' : 'ipv4');
}

function ssrfError(message) {
  const e = new Error(message);
  e.code = 'SSRF_BLOCKED';
  return e;
}

/** Validation synchrone de la forme de l'URL (schéma, port, identifiants, hôte littéral). */
function assertUrlShape(rawUrl) {
  let parsed;
  try { parsed = new URL(rawUrl); } catch { throw ssrfError('URL invalide'); }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw ssrfError('Protocole non supporté (seuls HTTP et HTTPS sont autorisés)');
  }
  if (parsed.username || parsed.password) throw ssrfError('Identifiants dans l’URL interdits');
  if (parsed.port && parsed.port !== '80' && parsed.port !== '443') throw ssrfError('Port non autorisé');
  const host = stripBrackets(parsed.hostname.toLowerCase());
  if (!host || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) {
    throw ssrfError('Accès aux adresses locales et privées interdit (SSRF Protection)');
  }
  if (net.isIP(host) && isBlockedAddress(host)) {
    throw ssrfError('Accès aux adresses locales et privées interdit (SSRF Protection)');
  }
  return parsed;
}

/** Validation complète : forme + résolution DNS (toutes les adresses doivent être publiques). */
async function assertSafeUrl(rawUrl) {
  const parsed = assertUrlShape(rawUrl);
  const host = stripBrackets(parsed.hostname.toLowerCase());
  if (net.isIP(host)) return parsed;
  let addrs;
  try { addrs = await dns.promises.lookup(host, { all: true, verbatim: true }); } catch { throw ssrfError('Hôte introuvable'); }
  if (!addrs.length || addrs.some(a => isBlockedAddress(a.address))) {
    throw ssrfError('Accès aux adresses locales et privées interdit (SSRF Protection)');
  }
  return parsed;
}

/** `lookup` de l'agent : applique le contrôle à l'adresse réellement utilisée pour la connexion. */
function guardedLookup(hostname, options, callback) {
  if (typeof options === 'function') { callback = options; options = {}; }
  dns.lookup(hostname, { ...options, all: true, verbatim: true }, (err, addrs) => {
    if (err) return callback(err);
    if (!addrs.length || addrs.some(a => isBlockedAddress(a.address))) {
      return callback(ssrfError('Accès aux adresses locales et privées interdit (SSRF Protection)'));
    }
    if (options && options.all) return callback(null, addrs);
    return callback(null, addrs[0].address, addrs[0].family);
  });
}

const httpAgent = new http.Agent({ lookup: guardedLookup });
const httpsAgent = new https.Agent({ lookup: guardedLookup });

/**
 * GET sécurisé. Même contrat qu'axios.get (renvoie la réponse axios), avec redirections revalidées.
 * Options : timeout (ms), headers, maxRedirects (défaut 3), maxContentLength (défaut 5 Mo).
 */
async function safeGet(rawUrl, { timeout = 6000, headers = {}, maxRedirects = 3, maxContentLength = 5 * 1024 * 1024 } = {}) {
  let current = rawUrl;
  for (let hop = 0; hop <= maxRedirects; hop++) {
    await assertSafeUrl(current);
    const response = await axios.get(current, {
      timeout,
      headers,
      httpAgent,
      httpsAgent,
      maxRedirects: 0,
      maxContentLength,
      maxBodyLength: maxContentLength,
      validateStatus: (s) => s >= 200 && s < 400,
    });
    if (response.status >= 300 && response.status < 400 && response.headers.location) {
      current = new URL(response.headers.location, current).toString();
      continue;
    }
    return response;
  }
  throw ssrfError('Trop de redirections');
}

module.exports = { safeGet, assertSafeUrl, assertUrlShape, isBlockedAddress, guardedLookup };
