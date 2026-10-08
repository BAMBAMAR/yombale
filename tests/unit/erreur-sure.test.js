// SRG-A1-026 : une erreur du client HTTP ne doit livrer ni jeton, ni code de connexion, ni numéro au journal
const util = require('util');
const { erreurPourJournal, purgerErreurHttp } = require('../../backend/lib/erreurSure');

const JETON = 'EAAGSECRETtokenWhatsApp0123456789';
const CODE = '482913';
const NUMERO = '221777202086';

// Forme d'une erreur axios : requête, en-têtes, corps et réponse sont attachés à l'erreur.
function erreurAxios() {
  const err = new Error('Request failed with status code 401');
  err.name = 'AxiosError';
  err.code = 'ERR_BAD_REQUEST';
  err.config = {
    url: 'https://graph.facebook.com/v21.0/123/messages',
    method: 'post',
    headers: { Authorization: `Bearer ${JETON}`, 'Content-Type': 'application/json' },
    data: JSON.stringify({ to: NUMERO, type: 'text', text: { body: `Votre code Nopalou : ${CODE}` } }),
  };
  err.request = { _header: `POST /v21.0/123/messages HTTP/1.1\r\nAuthorization: Bearer ${JETON}\r\n`, path: '/v21.0/123/messages' };
  err.response = { status: 401, statusText: 'Unauthorized', headers: { 'set-cookie': 'x=y' }, config: err.config, request: err.request, data: { error: { message: 'Invalid OAuth access token', code: 190 } } };
  return err;
}

const exposeUnSecret = (texte) => [JETON, CODE, NUMERO, 'Bearer E'].some((s) => texte.includes(s));

describe('SRG-A1-026 : erreurs du client HTTP', () => {
  test('l\'erreur brute livre bien les trois secrets (le défaut)', () => {
    expect(exposeUnSecret(util.inspect(erreurAxios(), { depth: 6 }))).toBe(true);
  });

  test('erreurPourJournal ne contient ni jeton, ni code, ni numéro', () => {
    const ligne = erreurPourJournal(erreurAxios());
    expect(exposeUnSecret(ligne)).toBe(false);
    expect(ligne).toContain('HTTP 401');
    expect(ligne).toContain('Invalid OAuth access token');
  });

  test('erreurPourJournal masque un jeton ou un code qui se trouve dans le message', () => {
    const e = new Error(`échec avec Bearer ${JETON} et le code ${CODE}`);
    const ligne = erreurPourJournal(e);
    expect(exposeUnSecret(ligne)).toBe(false);
    expect(ligne).toContain('[masqué]');
    expect(ligne).toContain('[6 chiffres]');
  });

  test('erreurPourJournal accepte une valeur qui n\'est pas une erreur', () => {
    expect(erreurPourJournal(null)).toBe('erreur inconnue');
    expect(erreurPourJournal('boum')).toBe('boum');
    expect(erreurPourJournal(undefined)).toBe('erreur inconnue');
  });

  test('purgerErreurHttp retire la requête : l\'erreur journalisée telle quelle ne livre plus rien', () => {
    const err = purgerErreurHttp(erreurAxios());
    expect(exposeUnSecret(util.inspect(err, { depth: 6 }))).toBe(false);
    expect(exposeUnSecret(JSON.stringify(err, Object.getOwnPropertyNames(err)))).toBe(false);
  });

  test('purgerErreurHttp garde ce que les appelants lisent', () => {
    const err = purgerErreurHttp(erreurAxios());
    expect(err.message).toBe('Request failed with status code 401');
    expect(err.response.status).toBe(401);
    expect(err.response.data.error.message).toBe('Invalid OAuth access token');
    expect(err.response.data.error.code).toBe(190);
    expect(err.config.url).toContain('graph.facebook.com');
  });

  test('purgerErreurHttp ne plante ni sur une erreur simple ni sur autre chose qu\'une erreur', () => {
    const simple = new Error('réseau coupé');
    expect(purgerErreurHttp(simple)).toBe(simple);
    expect(purgerErreurHttp(null)).toBeNull();
    expect(purgerErreurHttp('texte')).toBe('texte');
  });
});
