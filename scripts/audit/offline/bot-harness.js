// Banc d'essai du chatbot WhatsApp : exécute le VRAI chatbot contre la base d'audit locale ; seul l'envoi Meta (axios vers graph.facebook.com) est remplacé par une capture.
const path = require('path'); const root = path.resolve(__dirname, '..', '..', '..');
const axios = require(path.join(root, 'node_modules', 'axios')); const sent = [];
axios.post = async (url, payload) => { if (!/graph\.facebook\.com/.test(url)) throw new Error('AUDIT: appel sortant inattendu ' + url); sent.push(payload); return { data: { messages: [{ id: 'wamid.audit' + sent.length }] } }; };
axios.get = async (url) => { throw new Error('AUDIT: GET sortant bloqué ' + url); };
if (!/127\.0\.0\.1:54329/.test(process.env.DATABASE_URL || '')) { console.error('REFUS: base non locale'); process.exit(2); }
const bot = require(path.join(root, 'backend', 'services', 'whatsapp-chatbot.js'));
const { pool } = require(path.join(root, 'backend', 'models', 'db.js'));
let n = 0; const id = () => 'wamid.in' + Date.now() + (n++);
function texteDe(p) { if (!p) return ''; if (p.text) return p.text.body; if (p.interactive) { const i = p.interactive; const rows = (i.action && i.action.sections ? i.action.sections.flatMap(s => s.rows.map(r => `[${r.id}] ${r.title}`)) : []).concat(i.action && i.action.buttons ? i.action.buttons.map(b => `(${b.reply.id}) ${b.reply.title}`) : []); return (i.body && i.body.text || '') + (rows.length ? '\n   ' + rows.join('\n   ') : ''); } if (p.template) return '[template ' + p.template.name + '] ' + JSON.stringify(p.template.components || []).slice(0, 400); return JSON.stringify(p).slice(0, 200); }
async function dire(phone, msg, label) { const debut = sent.length; await bot.handleIncoming(Object.assign({ from: phone, id: id(), timestamp: String(Math.floor(Date.now() / 1000)) }, msg)); await new Promise(r => setTimeout(r, 400)); const out = sent.slice(debut).map(p => ({ a: p.to, contenu: texteDe(p) })); console.log('\n>>> ' + label); out.forEach(o => console.log('  <- [' + o.a + '] ' + o.contenu.replace(/\n/g, '\n     '))); return out; }
const texte = (body) => ({ type: 'text', text: { body } });
const choix = (idc, title = '') => ({ type: 'interactive', interactive: { type: 'list_reply', list_reply: { id: idc, title } } });
const bouton = (idc, title = '') => ({ type: 'interactive', interactive: { type: 'button_reply', button_reply: { id: idc, title } } });
module.exports = { dire, texte, choix, bouton, pool, sent, bot };
