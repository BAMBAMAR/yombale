// Sonde AUDIT VOIX n°6 : une note vocale WhatsApp (OGG/Opus) passe-t-elle par uploadBuffer ? Aucun reseau, aucune cle.
// Usage : node scripts/audit/voice/06-whatsapp-audio-proof.js
const path = require('path')
const root = path.resolve(__dirname, '..', '..', '..')
const { exigerTypes, IMAGES_OU_PDF } = require(path.join(root, 'backend', 'lib', 'fichiersAutorises'))
// En-tete reel d'une note vocale WhatsApp : conteneur Ogg ("OggS") + paquet OpusHead.
const ogg = Buffer.concat([Buffer.from('OggS'), Buffer.from([0, 2, 0, 0, 0, 0, 0, 0, 0, 0]), Buffer.from('OpusHead'), Buffer.alloc(64)])
// En-tete JPEG pour controle positif.
const jpg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64)])
for (const [nom, buf] of [['note vocale OGG/Opus', ogg], ['photo JPEG (controle)', jpg]]) {
  try { exigerTypes(buf, IMAGES_OU_PDF, 'image'); console.log(nom, '-> ACCEPTE par uploadBuffer') } catch (e) { console.log(nom, '-> REFUSE :', e.message) }
}
