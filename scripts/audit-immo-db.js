require('dotenv').config();
const { pool } = require('../backend/models/db');

async function main() {
  try {
    // 1. All tables
    const resTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    const allTables = resTables.rows.map(r => r.table_name);
    console.log('=== TOTAL TABLES ===', allTables.length);
    
    const immoTables = allTables.filter(t => 
      t.includes('immo') || 
      t.includes('bien') || 
      t.includes('bail') || 
      t.includes('loyer') || 
      t.includes('proprio') || 
      t.includes('locat') ||
      t.includes('agence') ||
      t.includes('contact') ||
      t.includes('visite') ||
      t.includes('mandat') ||
      t.includes('facture') ||
      t.includes('credit')
    );
    console.log('=== IMMO-RELATED TABLES ===');
    console.log(immoTables);

    // 2. Foreign keys and constraints between these tables
    const resFK = await pool.query(`
      SELECT
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.delete_rule,
        rc.update_rule
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.referential_constraints AS rc
        ON tc.constraint_name = rc.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_schema = 'public'
      ORDER BY tc.table_name, kcu.column_name;
    `);
    console.log('\n=== FOREIGN KEYS ===');
    const fks = resFK.rows.filter(r => 
      immoTables.includes(r.table_name) || immoTables.includes(r.foreign_table_name)
    );
    console.log(JSON.stringify(fks, null, 2));

    // 3. For each immo table, get columns, data types, is_nullable, column_default
    console.log('\n=== COLUMNS PER TABLE ===');
    for (const t of immoTables) {
      const cols = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position;
      `, [t]);
      console.log(`\n--- TABLE: ${t} (${cols.rows.length} cols) ---`);
      cols.rows.forEach(c => {
        console.log(`  ${c.column_name}: ${c.data_type} (nullable: ${c.is_nullable}, default: ${c.column_default})`);
      });
    }

  } catch (err) {
    console.error('Error in audit-immo-db:', err);
  } finally {
    await pool.end();
  }
}

main();
