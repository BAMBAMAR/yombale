// AUD-144 : les journaux d'accès ne contiennent ni clé API, ni jeton, ni code, ni numéro de téléphone
const { redigerUrl } = require('../../backend/lib/redactUrl');
const fs = require('fs');
const path = require('path');

describe('redigerUrl (AUD-144)', () => {
  test('masque les paramètres sensibles et conserve les autres', () => {
    expect(redigerUrl('/api/v1/prix?api_key=nopalou_sk_live_ABC&q=iphone')).toBe('/api/v1/prix?api_key=[masque]&q=iphone');
    expect(redigerUrl('/api/locatif-immo/public/bail/1.pdf?lien=ABC&tel=771234567')).toBe('/api/locatif-immo/public/bail/1.pdf?lien=[masque]&tel=[masque]');
    expect(redigerUrl('/x?TOKEN=a&Email=a%40b.c&page=2')).toBe('/x?TOKEN=[masque]&Email=[masque]&page=2');
  });
  test('reconnaît un nom de paramètre encodé et ignore les URL sans requête', () => {
    expect(redigerUrl('/api/x?a=1&%74oken=zz')).toBe('/api/x?a=1&%74oken=[masque]');
    expect(redigerUrl('/api/produits')).toBe('/api/produits');
    expect(redigerUrl(undefined)).toBe('');
  });
  test('aucune valeur sensible ne survit dans la sortie', () => {
    const sortie = redigerUrl('/p?api_key=SECRET1&code=654321&tel=221771234567&secret=S3&q=ok');
    for (const v of ['SECRET1', '654321', '771234567', 'S3']) expect(sortie).not.toContain(v);
    expect(sortie).toContain('q=ok');
  });
  test('le journal d\'accès de l\'application utilise bien l\'URL expurgée (et non :url)', () => {
    const app = fs.readFileSync(path.join(__dirname, '../../backend/app.js'), 'utf8');
    expect(app).toMatch(/:method :safeurl/);
    expect(app).not.toMatch(/":method :url /);
    expect(app).not.toMatch(/\[:id\] :method :url /);
  });
});
