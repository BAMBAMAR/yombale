// AUD-031 — littéraux SQL de la sauvegarde applicative
const { formaterValeurSql, litteralTableau } = require('../../backend/lib/sqlDump');

describe('formaterValeurSql', () => {
  test('colonne text[] : littéral de tableau PostgreSQL, jamais jsonb', () => {
    expect(formaterValeurSql(['a', 'b'], '_text')).toBe(`'{"a","b"}'`);
    expect(formaterValeurSql([], '_text')).toBe(`'{}'`);
    expect(formaterValeurSql(['https://x.test/a.jpg?x=1&y=2'], '_text')).toBe(`'{"https://x.test/a.jpg?x=1&y=2"}'`);
  });

  test('échappements : guillemets, antislash, apostrophe, NULL, tableaux imbriqués, nombres', () => {
    expect(litteralTableau(['il a dit "oui"', 'a\\b', null])).toBe('{"il a dit \\"oui\\"","a\\\\b",NULL}');
    expect(formaterValeurSql(["l'été"], '_text')).toBe(`'{"l''été"}'`);
    expect(litteralTableau([[1, 2], [3, 4]])).toBe('{{1,2},{3,4}}');
    expect(formaterValeurSql([1, 2, 3], '_int4')).toBe(`'{1,2,3}'`);
  });

  test('colonne jsonb : reste du JSON même si la valeur JavaScript est un tableau ou un objet', () => {
    expect(formaterValeurSql(['a', 'b'], 'jsonb')).toBe(`'["a","b"]'::jsonb`);
    expect(formaterValeurSql({ k: "l'été" }, 'jsonb')).toBe(`'{"k":"l''été"}'::jsonb`);
    expect(formaterValeurSql([], 'json')).toBe(`'[]'::jsonb`);
  });

  test('types scalaires', () => {
    expect(formaterValeurSql(null, 'text')).toBe('NULL');
    expect(formaterValeurSql(undefined, 'text')).toBe('NULL');
    expect(formaterValeurSql(true, 'bool')).toBe('TRUE');
    expect(formaterValeurSql(false, 'bool')).toBe('FALSE');
    expect(formaterValeurSql(42, 'int4')).toBe(42);
    expect(formaterValeurSql(NaN, 'float8')).toBe('NULL');
    expect(formaterValeurSql("d'Artagnan", 'text')).toBe(`'d''Artagnan'`);
    expect(formaterValeurSql('123.45', 'numeric')).toBe(`'123.45'`);
  });

  test('dates : timestamptz en ISO UTC, colonne date sans décalage de fuseau, octets en hexadécimal', () => {
    expect(formaterValeurSql(new Date('2026-09-30T12:34:56.000Z'), 'timestamptz')).toBe(`'2026-09-30T12:34:56.000Z'::timestamptz`);
    // node-pg construit les colonnes `date` à minuit LOCAL : on relit les composantes locales
    expect(formaterValeurSql(new Date(2026, 8, 30), 'date')).toBe(`'2026-09-30'::date`);
    expect(formaterValeurSql(new Date('invalid'), 'timestamptz')).toBe('NULL');
    expect(formaterValeurSql(Buffer.from([0, 255, 16]), 'bytea')).toBe(`'\\x00ff10'::bytea`);
  });
});
