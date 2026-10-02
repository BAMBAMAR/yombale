// AUD-201 : une note vocale WhatsApp (OGG/Opus) doit être acceptée comme audio, jamais comme image.
const { exigerTypes, detecterType, AUDIOS, IMAGES_OU_PDF } = require('../../backend/lib/fichiersAutorises');

const ogg = Buffer.concat([Buffer.from('OggS'), Buffer.from([0, 2, 0, 0, 0, 0, 0, 0, 0, 0]), Buffer.from('OpusHead'), Buffer.alloc(64)]);
const jpg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64)]);
const html = Buffer.from('<html><script>alert(1)</script></html>');

describe('AUD-201 notes vocales', () => {
  test('une note OGG/Opus est un audio autorisé', () => {
    expect(detecterType(ogg)).toBe('ogg');
    expect(exigerTypes(ogg, AUDIOS, 'audio')).toBe('ogg');
  });
  test('uploadBuffer (images/PDF) continue de refuser l\'audio (AUD-146 intact)', () => {
    expect(() => exigerTypes(ogg, IMAGES_OU_PDF, 'image')).toThrow(/non autorisé/);
  });
  test('une image ou du HTML ne passe pas pour de l\'audio', () => {
    expect(() => exigerTypes(jpg, AUDIOS, 'audio')).toThrow(/non autorisé/);
    expect(() => exigerTypes(html, AUDIOS, 'audio')).toThrow(/non autorisé/);
  });
});
