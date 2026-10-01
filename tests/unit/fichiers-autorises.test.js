// AUD-146 : contrôle du contenu réel des fichiers téléversés
const { detecterType, exigerTypes, controlerFichiers, IMAGES, DOCUMENTS, VIDEOS } = require('../../backend/lib/fichiersAutorises');

const PDF = Buffer.from('%PDF-1.7\n1 0 obj\n');
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46]);
const WEBP = Buffer.concat([Buffer.from('RIFF'), Buffer.from([0, 0, 0, 0]), Buffer.from('WEBPVP8 ')]);
const AVIF = Buffer.concat([Buffer.from([0, 0, 0, 0x1c]), Buffer.from('ftypavif'), Buffer.from([0, 0, 0, 0])]);
const MP4 = Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from('ftypisom'), Buffer.from([0, 0, 0, 0])]);
const HTML = Buffer.from('<html><script>alert(1)</script></html>');
const SVG = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>');
const EXE = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0, 0, 0]);

describe('fichiersAutorises (AUD-146)', () => {
  test('reconnaît les formats légitimes par leur contenu', () => {
    expect(detecterType(PDF)).toBe('pdf');
    expect(detecterType(PNG)).toBe('png');
    expect(detecterType(JPEG)).toBe('jpeg');
    expect(detecterType(WEBP)).toBe('webp');
    expect(detecterType(AVIF)).toBe('avif');
    expect(detecterType(MP4)).toBe('mp4');
  });

  test('refuse HTML, SVG, exécutable, vide, texte : quel que soit le nom ou le Content-Type annoncé', () => {
    for (const b of [HTML, SVG, EXE, Buffer.alloc(0), Buffer.from('juste du texte')]) {
      expect(() => exigerTypes(b, DOCUMENTS)).toThrow(/non autorisé/);
      expect(() => exigerTypes(b, IMAGES)).toThrow(/non autorisé/);
    }
    expect(() => exigerTypes(PDF, IMAGES)).toThrow();      // un PDF n'est pas une image
    expect(() => exigerTypes(PNG, VIDEOS)).toThrow();      // une image n'est pas une vidéo
    expect(() => exigerTypes(MP4, IMAGES)).toThrow();      // la signature « ftyp » d'une vidéo n'est pas une image
  });

  test('l\'erreur porte le statut 400', () => {
    try { exigerTypes(HTML, DOCUMENTS); } catch (e) { expect(e.status).toBe(400); expect(e.code).toBe('TYPE_FICHIER_NON_AUTORISE'); return; }
    throw new Error('aucune erreur levée');
  });

  test('middleware : 400 explicite sur un faux PDF, passage sur un vrai ; sans fichier, il laisse la route décider', () => {
    const mw = controlerFichiers(DOCUMENTS);
    const run = (req) => {
      const res = { statusCode: null, body: null, status(c) { this.statusCode = c; return this; }, json(b) { this.body = b; return this; } };
      let suivant = false;
      mw(req, res, () => { suivant = true; });
      return { res, suivant };
    };
    const faux = run({ file: { buffer: HTML, originalname: 'cni.pdf', mimetype: 'application/pdf' } });
    expect(faux.suivant).toBe(false);
    expect(faux.res.statusCode).toBe(400);
    expect(faux.res.body.error).toMatch(/cni\.pdf/);
    expect(run({ file: { buffer: PDF, originalname: 'cni.pdf' } }).suivant).toBe(true);
    expect(run({}).suivant).toBe(true);
    expect(run({ files: { logo: [{ buffer: PNG }], cover: [{ buffer: EXE, originalname: 'x.png' }] } }).suivant).toBe(false);
    expect(run({ files: [{ buffer: JPEG }, { buffer: SVG, originalname: 'a.jpg' }] }).suivant).toBe(false);
  });
});
