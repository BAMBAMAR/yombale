// AUD-026 — Requêtes sortantes sûres (backend/lib/safeFetch.js)
process.env.NODE_ENV = 'test';

jest.mock('axios');
const axios = require('axios');
const dns = require('dns');
const { isBlockedAddress, assertUrlShape, assertSafeUrl, safeGet, guardedLookup } = require('../../backend/lib/safeFetch');

afterEach(() => { jest.restoreAllMocks(); axios.get.mockReset(); });

describe('isBlockedAddress — adresses privées, réservées et contournements connus', () => {
  const blocked = [
    '127.0.0.1', '127.1.2.3', '0.0.0.0', '10.0.0.5', '172.16.0.1', '172.31.255.1', '192.168.1.1',
    '169.254.169.254', '100.64.0.1', '198.18.0.1', '224.0.0.1', '240.0.0.1',
    '::1', '::', 'fd00::1', 'fc00::1', 'fe80::1', '::ffff:127.0.0.1', '::ffff:10.0.0.1', '64:ff9b::7f00:1',
  ];
  test.each(blocked)('refuse %s', (ip) => { expect(isBlockedAddress(ip)).toBe(true); });

  const allowed = ['8.8.8.8', '1.1.1.1', '93.184.216.34', '2606:4700:4700::1111'];
  test.each(allowed)('autorise %s', (ip) => { expect(isBlockedAddress(ip)).toBe(false); });

  test('une valeur qui n\'est pas une IP est refusée', () => {
    expect(isBlockedAddress('example.com')).toBe(true);
    expect(isBlockedAddress('')).toBe(true);
  });
});

describe('assertUrlShape — schéma, port, identifiants, hôtes littéraux', () => {
  const bad = [
    'http://[::1]/', 'http://[::ffff:127.0.0.1]/', 'http://[fd00::1]/', 'http://100.64.0.1/', 'http://127.0.0.1/',
    'http://localhost/', 'http://x.localhost/', 'http://svc.internal/', 'http://db.local/',
    'file:///etc/passwd', 'ftp://example.com/', 'http://example.com:8080/', 'http://user:pw@example.com/',
    'http://2130706433/', 'http://0x7f000001/', 'http://169.254.169.254/latest/meta-data/',
  ];
  test.each(bad)('refuse %s', (u) => { expect(() => assertUrlShape(u)).toThrow(); });

  test('accepte une URL publique standard', () => {
    expect(() => assertUrlShape('https://www.aliexpress.com/item/123.html')).not.toThrow();
    expect(() => assertUrlShape('http://example.com:80/x')).not.toThrow();
    expect(() => assertUrlShape('https://example.com:443/x')).not.toThrow();
  });
});

describe('assertSafeUrl — résolution DNS', () => {
  test('refuse un nom qui résout vers une IP privée (ex. localtest.me -> 127.0.0.1)', async () => {
    jest.spyOn(dns.promises, 'lookup').mockResolvedValue([{ address: '127.0.0.1', family: 4 }]);
    await expect(assertSafeUrl('http://localtest.me/')).rejects.toThrow(/interdit/);
  });
  test('refuse si UNE seule des adresses résolues est privée (rebinding à réponses multiples)', async () => {
    jest.spyOn(dns.promises, 'lookup').mockResolvedValue([{ address: '8.8.8.8', family: 4 }, { address: '10.0.0.7', family: 4 }]);
    await expect(assertSafeUrl('http://mixed.example/')).rejects.toThrow();
  });
  test('accepte un nom qui résout vers une adresse publique', async () => {
    jest.spyOn(dns.promises, 'lookup').mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
    await expect(assertSafeUrl('https://example.com/')).resolves.toBeTruthy();
  });
  test('refuse un hôte introuvable', async () => {
    jest.spyOn(dns.promises, 'lookup').mockRejectedValue(new Error('ENOTFOUND'));
    await expect(assertSafeUrl('https://nx.example/')).rejects.toThrow(/introuvable/);
  });
});

describe('guardedLookup — contrôle au moment de la connexion', () => {
  test('refuse une adresse privée renvoyée par le DNS', (done) => {
    jest.spyOn(dns, 'lookup').mockImplementation((h, o, cb) => cb(null, [{ address: '192.168.0.10', family: 4 }]));
    guardedLookup('rebind.example', {}, (err) => { expect(err).toBeTruthy(); expect(err.code).toBe('SSRF_BLOCKED'); done(); });
  });
  test('renvoie l\'adresse publique (mode all et mode simple)', (done) => {
    jest.spyOn(dns, 'lookup').mockImplementation((h, o, cb) => cb(null, [{ address: '93.184.216.34', family: 4 }]));
    guardedLookup('ok.example', { all: true }, (err, addrs) => {
      expect(err).toBeNull(); expect(addrs[0].address).toBe('93.184.216.34');
      guardedLookup('ok.example', {}, (e2, addr, fam) => { expect(e2).toBeNull(); expect(addr).toBe('93.184.216.34'); expect(fam).toBe(4); done(); });
    });
  });
});

describe('safeGet — redirections revalidées', () => {
  test('une redirection vers une IP privée est bloquée, la 2e requête n\'est jamais émise', async () => {
    jest.spyOn(dns.promises, 'lookup').mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
    axios.get.mockResolvedValueOnce({ status: 302, headers: { location: 'http://10.0.0.1/admin' }, data: '' });
    await expect(safeGet('https://example.com/start')).rejects.toThrow(/interdit/);
    expect(axios.get).toHaveBeenCalledTimes(1);
  });
  test('suit une redirection vers un hôte public puis renvoie la réponse', async () => {
    jest.spyOn(dns.promises, 'lookup').mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
    axios.get
      .mockResolvedValueOnce({ status: 301, headers: { location: '/final' }, data: '' })
      .mockResolvedValueOnce({ status: 200, headers: {}, data: '<html>ok</html>' });
    const r = await safeGet('https://example.com/start');
    expect(r.data).toBe('<html>ok</html>');
    expect(axios.get.mock.calls[1][0]).toBe('https://example.com/final');
    // les appels désactivent le suivi automatique d'axios et utilisent l'agent protégé
    expect(axios.get.mock.calls[0][1].maxRedirects).toBe(0);
    expect(axios.get.mock.calls[0][1].httpsAgent).toBeTruthy();
  });
  test('limite le nombre de redirections', async () => {
    jest.spyOn(dns.promises, 'lookup').mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
    axios.get.mockResolvedValue({ status: 302, headers: { location: 'https://example.com/loop' }, data: '' });
    await expect(safeGet('https://example.com/loop', { maxRedirects: 2 })).rejects.toThrow(/redirections/);
  });
});
