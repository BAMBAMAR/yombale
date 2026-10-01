// tests/unit/kalpe-essai.test.js — Sama Xaalis : l'essai suit le réglage admin (audit UX/SEO du 2026-10-01, AUD-160)
const fs = require('fs');
const path = require('path');
const { dureeEssaiKalpe, activerKalpe } = require('../../backend/lib/kalpeEssai');

describe('dureeEssaiKalpe', () => {
  test('valeur du réglage, repli sur 30 si absente ou invalide', () => {
    expect(dureeEssaiKalpe('14')).toBe(14);
    expect(dureeEssaiKalpe(45)).toBe(45);
    expect(dureeEssaiKalpe(undefined)).toBe(30);
    expect(dureeEssaiKalpe('abc')).toBe(30);
    expect(dureeEssaiKalpe(0)).toBe(30);
    expect(dureeEssaiKalpe(999)).toBe(30);
  });
});

describe('activerKalpe', () => {
  const poolEspion = () => {
    const appels = [];
    return { appels, query: jest.fn(async (sql, params) => { appels.push({ sql, params }); return { rows: [{ id: 1 }] }; }) };
  };

  test('la durée envoyée à la base est celle du réglage, pas 365', async () => {
    const pool = poolEspion();
    await activerKalpe(pool, 'u1', '14');
    expect(pool.appels[0].params).toEqual(['u1', '14']);
    expect(pool.appels[0].sql).not.toMatch(/365/);
  });

  test('réactiver ne prolonge jamais la date de fin d\'un compte existant', async () => {
    const pool = poolEspion();
    await activerKalpe(pool, 'u1', 30);
    const sql = pool.appels[0].sql;
    expect(sql).toMatch(/ON CONFLICT \(utilisateur_id\) DO UPDATE SET\s+statut = 'actif'/);
    expect(sql).not.toMatch(/DO UPDATE SET[\s\S]*fin\s*=/);
  });
});

describe('la route /api/kalpe/activer', () => {
  test('lit le réglage kalpe_essai_jours et n\'écrit plus 365 jours en dur', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', '..', 'backend', 'routes', 'kalpe.js'), 'utf8');
    expect(src).toMatch(/kalpe_essai_jours/);
    expect(src).toMatch(/activerKalpe\(/);
    expect(src).not.toMatch(/365 days/);
  });
});
