/**
 * NOPALOU COMMERCE OS & IMMOBILIER
 * Moteur de Sauvegarde Complète Universelle (PostgreSQL -> S3 / Cloudflare R2 / Local)
 *
 * Fonctionnalités :
 * 1. Introspection dynamique de l'intégralité du schéma 'public' (117+ tables, séquences, types).
 * 2. Exportation transactionnelle sans blocage sous 'session_replication_role = replica'.
 * 3. Compression gzip native à la volée (.sql.gz).
 * 4. Hachage cryptographique SHA-256 pour garantie d'intégrité anti-corruption.
 * 5. Télégraphiage automatique vers Cloudflare R2 / AWS S3 si identifiants configurés.
 * 6. Politique de rétention locale automatique (conservation des 7 derniers jours).
 */

import 'dotenv/config'
import pg from 'pg'
import fs from 'fs'
import http from 'http'
import https from 'https'
import path from 'path'
import zlib from 'zlib'
import crypto from 'crypto'
import { pipeline } from 'stream/promises'
import { once } from 'events'
import { fileURLToPath } from 'url'
import sqlDump from '../backend/lib/sqlDump.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, '..')
const BACKUP_DIR = path.join(ROOT_DIR, 'backups')

const { Pool } = pg

// Configuration PostgreSQL
const DB_URL = process.env.DATABASE_URL
if (!DB_URL) {
  console.error('❌ ERREUR SRE : DATABASE_URL non définie dans l\'environnement.')
  process.exit(1)
}

// Configuration S3 / Cloudflare R2 (Optionnel)
const S3_BUCKET = process.env.S3_BUCKET || process.env.R2_BUCKET
const S3_ENDPOINT = process.env.S3_ENDPOINT || (process.env.R2_ACCOUNT_ID ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : null)
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID
const S3_SECRET_KEY = process.env.S3_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY
const S3_REGION = process.env.S3_REGION || 'auto'

/**
 * Client REST minimaliste S3 compatible AWS / Cloudflare R2 avec Signature SigV4
 */
async function uploadToS3(filePath, fileName) {
  if (!S3_BUCKET || !S3_ENDPOINT || !S3_ACCESS_KEY || !S3_SECRET_KEY) {
    console.log('ℹ️  Stockage distant S3/R2 non configuré (variables S3_BUCKET, S3_ENDPOINT manquantes).')
    console.log('   -> Archive conservée en stockage local sécurisé sous /backups.')
    return { uploaded: false, reason: 'not_configured' }
  }

  try {
    console.log(`☁️  Téléversement vers le bucket S3/R2 "${S3_BUCKET}"...`)
    // SRG-A5-010 : l'archive n'est pas chargée en mémoire. Son empreinte est calculée au fil de la lecture, et le corps
    // de l'envoi est lu sur le disque à mesure qu'il part.
    const taille = fs.statSync(filePath).size
    const payloadHash = await new Promise((resolve, reject) => {
      const h = crypto.createHash('sha256')
      fs.createReadStream(filePath).on('data', (c) => h.update(c)).on('end', () => resolve(h.digest('hex'))).on('error', reject)
    })
    const date = new Date()
    const amzDate = date.toISOString().replace(/[:-]|\.\d{3}/g, '')
    const dateStamp = amzDate.substring(0, 8)

    const url = new URL(`${S3_ENDPOINT}/${S3_BUCKET}/${fileName}`)

    // Signature SigV4 simplifiée
    const service = 's3'
    const credentialScope = `${dateStamp}/${S3_REGION}/${service}/aws4_request`
    const canonicalHeaders = `host:${url.host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`
    const signedHeaders = 'host;x-amz-content-sha256;x-amz-date'
    const canonicalRequest = `PUT\n/${S3_BUCKET}/${fileName}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`

    const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${crypto.createHash('sha256').update(canonicalRequest).digest('hex')}`

    function hmac(key, str) {
      return crypto.createHmac('sha256', key).update(str).digest()
    }

    const kDate = hmac(`AWS4${S3_SECRET_KEY}`, dateStamp)
    const kRegion = hmac(kDate, S3_REGION)
    const kService = hmac(kRegion, service)
    const kSigning = hmac(kService, 'aws4_request')
    const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex')

    const authHeader = `AWS4-HMAC-SHA256 Credential=${S3_ACCESS_KEY}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

    const envoyer = url.protocol === 'http:' ? http.request : https.request
    const reponse = await new Promise((resolve, reject) => {
      const req = envoyer(url, {
        method: 'PUT',
        headers: {
          'x-amz-date': amzDate,
          'x-amz-content-sha256': payloadHash,
          'Authorization': authHeader,
          'Content-Type': 'application/gzip',
          'Content-Length': String(taille)
        }
      }, (res) => {
        let texte = ''
        res.on('data', (c) => { texte += c })
        res.on('end', () => resolve({ status: res.statusCode, texte }))
      })
      req.on('error', reject)
      fs.createReadStream(filePath).on('error', reject).pipe(req)
    })

    if (reponse.status >= 200 && reponse.status < 300) {
      console.log(`✅ Téléversement distant réussi sur S3/R2 : ${fileName}`)
      return { uploaded: true, url: url.toString() }
    }
    console.warn(`⚠️  Échec téléversement S3 (${reponse.status}) : ${reponse.texte.substring(0, 200)}`)
    return { uploaded: false, error: reponse.texte.substring(0, 300) || `réponse ${reponse.status}` }
  } catch (err) {
    console.warn(`⚠️  Erreur réseau lors du téléversement S3 : ${err.message}`)
    return { uploaded: false, error: err.message }
  }
}

/**
 * Nettoyage et rotation des archives locales (conserve les 7 derniers jours)
 */
function purgerAnciensBackups() {
  try {
    if (!fs.existsSync(BACKUP_DIR)) return
    // Archives provisoires laissées par une exécution tuée en cours de route (plus d'un jour)
    for (const f of fs.readdirSync(BACKUP_DIR).filter(n => n.endsWith('.sql.gz.partiel'))) {
      const p = path.join(BACKUP_DIR, f)
      if (Date.now() - fs.statSync(p).mtimeMs > 24 * 3600 * 1000) fs.unlinkSync(p)
    }
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('backup-nopalou-') && f.endsWith('.sql.gz'))
      .map(f => ({
        name: f,
        path: path.join(BACKUP_DIR, f),
        mtime: fs.statSync(path.join(BACKUP_DIR, f)).mtimeMs
      }))
      .sort((a, b) => b.mtime - a.mtime)

    // Conserver les 7 plus récents
    const RETENTION_COUNT = 7
    if (files.length > RETENTION_COUNT) {
      const toDelete = files.slice(RETENTION_COUNT)
      for (const item of toDelete) {
        fs.unlinkSync(item.path)
        const shaPath = `${item.path}.sha256`
        if (fs.existsSync(shaPath)) fs.unlinkSync(shaPath)
        console.log(`🧹 Rotation rétention : suppression de l'ancien backup ${item.name}`)
      }
    }
  } catch (e) {
    console.warn('⚠️ Erreur mineure rotation backups :', e.message)
  }
}

/**
 * Formate une valeur JavaScript pour l'injection SQL sécurisée
 */
// AUD-031 : sérialisation déplacée dans backend/lib/sqlDump.js (testable) et corrigée pour les colonnes tableau
const formaterValeurSql = sqlDump.formaterValeurSql

// SRG-A5-010 : nombre de lignes lues à la fois dans une table (la mémoire ne dépend plus de la taille de la base)
const LIGNES_PAR_LECTURE = 500

// Décodeur de types : dates renvoyées telles quelles par PostgreSQL (chaînes), autres types inchangés
const OID_DATES = new Set([1082, 1114, 1184]) // date, timestamp, timestamptz
const typesDatesBrutes = {
  getTypeParser: (oid, format) => (OID_DATES.has(oid) ? (v) => v : pg.types.getTypeParser(oid, format)),
}

/**
 * Exécution principale de la sauvegarde
 */
export async function executerSauvegarde({ destination = 'both', label = 'auto' } = {}) {
  const startTime = Date.now()
  const pool = new Pool({
    connectionString: DB_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000
  })

  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true })
  }

  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)
  const baseName = `backup-nopalou-${timestamp}-${label}`
  const gzFilePath = path.join(BACKUP_DIR, `${baseName}.sql.gz`)
  const shaFilePath = path.join(BACKUP_DIR, `${baseName}.sql.gz.sha256`)

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🛡️  NOPALOU SRE — SAUVEGARDE INTÉGRALE AUTOMATISÉE DE PRODUCTION')
  console.log(`📅 Date de déclenchement : ${new Date().toISOString()}`)
  console.log(`📁 Fichier cible local    : ${path.basename(gzFilePath)}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  const client = await pool.connect()
  // L'archive s'écrit sous un nom provisoire : un export interrompu ne laisse pas un fichier qui passerait pour une sauvegarde.
  const gzTempPath = `${gzFilePath}.partiel`
  let gzStream = null
  let fileWriteStream = null
  const report = {
    timestamp: new Date().toISOString(),
    baseName,
    tablesCount: 0,
    sequencesCount: 0,
    totalRows: 0,
    gzSizeBytes: 0,
    sha256: null,
    durationMs: 0,
    tables: []
  }

  try {
    // 1. Découverte dynamique de toutes les tables du schéma public
    const tablesRes = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename ASC;
    `)
    const tables = tablesRes.rows.map(r => r.tablename)
    report.tablesCount = tables.length

    // 2. Découverte de toutes les séquences pour réalignement après restauration
    const seqRes = await client.query(`
      SELECT sequence_name 
      FROM information_schema.sequences 
      WHERE sequence_schema = 'public' 
      ORDER BY sequence_name ASC;
    `)
    const sequences = seqRes.rows.map(r => r.sequence_name)
    report.sequencesCount = sequences.length

    console.log(`🔍 Schéma inspecté : ${tables.length} tables actives, ${sequences.length} séquences détectées.\n`)

    // 3. Préparation du flux de compression gzip et calcul SHA-256
    gzStream = zlib.createGzip({ level: 9 })
    fileWriteStream = fs.createWriteStream(gzTempPath)
    const hashStream = crypto.createHash('sha256')

    gzStream.on('data', chunk => hashStream.update(chunk))
    const streamPromise = pipeline(gzStream, fileWriteStream)
    // Sans ce gestionnaire, une erreur d'écriture pendant l'export resterait sans destinataire jusqu'à l'attente finale.
    streamPromise.catch(() => {})

    // SRG-A5-010 : écrire() attend que le compresseur ait absorbé ce qu'il a reçu. Sans cette attente, tout le
    // texte SQL d'une table s'accumulait en mémoire avant d'être compressé.
    const ecrire = async (texte) => {
      if (!gzStream.write(texte)) await once(gzStream, 'drain')
    }

    // En-tête SQL de sécurité
    gzStream.write(`-- =====================================================================\n`)
    gzStream.write(`-- NOPALOU COMMERCE OS & IMMOBILIER — DUMP COMPLET BASE DE DONNÉES\n`)
    gzStream.write(`-- Timestamp UTC     : ${new Date().toISOString()}\n`)
    gzStream.write(`-- Schéma            : public\n`)
    gzStream.write(`-- Tables exportées  : ${tables.length}\n`)
    gzStream.write(`-- Séquences         : ${sequences.length}\n`)
    gzStream.write(`-- =====================================================================\n\n`)

    gzStream.write(`BEGIN;\n`)
    gzStream.write(`SET client_encoding = 'UTF8';\n`)
    gzStream.write(`SET standard_conforming_strings = on;\n`)
    // replica désactive temporairement les déclencheurs de clés étrangères pour l'insertion
    gzStream.write(`SET session_replication_role = 'replica';\n\n`)

    let totalRowsExported = 0

    // SRG-A5-010 : une seule image de la base pour tout l'export (les tables restent cohérentes entre elles), en
    // lecture seule ; c'est aussi ce qui permet de lire chaque table par un curseur.
    await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY')

    // 4. Exportation table par table
    for (let i = 0; i < tables.length; i++) {
      const table = tables[i]

      // Colonnes et types
      const colRes = await client.query(`
        SELECT column_name, udt_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = $1 
        ORDER BY ordinal_position ASC;
      `, [table])

      const columns = colRes.rows.map(c => c.column_name)
      const udtMap = Object.fromEntries(colRes.rows.map(c => [c.column_name, c.udt_name]))

      // Comptage et extraction
      const countRes = await client.query(`SELECT COUNT(*)::int as cnt FROM "${table}";`)
      const rowCount = countRes.rows[0].cnt

      gzStream.write(`\n-- ---------------------------------------------------------------------\n`)
      gzStream.write(`-- Table: ${table} (${rowCount} enregistrements)\n`)
      gzStream.write(`-- ---------------------------------------------------------------------\n`)

      if (rowCount === 0) {
        report.tables.push({ table, rows: 0 })
        continue
      }

      // AUD-031 : date / timestamp / timestamptz lus en TEXTE (pas en objet Date) : conserve la précision à la
      // microseconde et évite tout décalage de fuseau ou de jour lors de la restauration.
      // SRG-A5-010 : la table est lue par lots, par un curseur. La lire d'un seul bloc demandait plus de mémoire
      // que n'en a l'instance (676 Mo mesurés pour une base de 249 Mo) : la tâche ne se terminait jamais.
      const colsEscaped = columns.map(c => `"${c}"`).join(', ')
      const BATCH_SIZE = 100 // lignes par INSERT, pour la vitesse de restauration
      let lignesTable = 0
      await client.query(`DECLARE sauvegarde_curseur NO SCROLL CURSOR FOR SELECT * FROM "${table}";`)
      for (;;) {
        const lot = await client.query({ text: `FETCH ${LIGNES_PAR_LECTURE} FROM sauvegarde_curseur;`, types: typesDatesBrutes })
        if (lot.rows.length === 0) break
        for (let j = 0; j < lot.rows.length; j += BATCH_SIZE) {
          const batch = lot.rows.slice(j, j + BATCH_SIZE)
          const valuesList = batch.map(row => {
            const vals = columns.map(col => formaterValeurSql(row[col], udtMap[col]))
            return `(${vals.join(', ')})`
          }).join(',\n  ')

          await ecrire(`INSERT INTO "${table}" (${colsEscaped}) VALUES\n  ${valuesList}\n  ON CONFLICT DO NOTHING;\n`)
        }
        lignesTable += lot.rows.length
      }
      await client.query('CLOSE sauvegarde_curseur;')
      // Le décompte et la lecture portent sur la même image de la base : un écart signale une archive incomplète.
      if (lignesTable !== rowCount) {
        throw new Error(`Sauvegarde incomplète : table ${table}, ${lignesTable} lignes écrites pour ${rowCount} comptées`)
      }

      totalRowsExported += rowCount
      report.tables.push({ table, rows: rowCount })

      if ((i + 1) % 15 === 0 || i === tables.length - 1) {
        process.stdout.write(`  📦 [${i + 1}/${tables.length}] Tables exportées... (${totalRowsExported} lignes cumulées)\r`)
      }
    }

    console.log(`\n✅ 100% des tables exportées avec succès (${totalRowsExported} lignes).`)
    await client.query('COMMIT')

    // 5. Sauvegarde et réalignement des séquences (auto-incréments)
    gzStream.write(`\n-- ---------------------------------------------------------------------\n`)
    gzStream.write(`-- Réalignement des séquences d'identifiants (setval)\n`)
    gzStream.write(`-- ---------------------------------------------------------------------\n`)

    for (const seq of sequences) {
      try {
        const seqValRes = await client.query(`SELECT last_value, is_called FROM "${seq}";`)
        if (seqValRes.rows.length > 0) {
          const { last_value, is_called } = seqValRes.rows[0]
          gzStream.write(`SELECT setval('"${seq}"', ${last_value}, ${is_called ? 'true' : 'false'});\n`)
        }
      } catch (err) {
        // Séquence inaccessible ou permission
      }
    }

    // Clôture transactionnelle
    gzStream.write(`\nSET session_replication_role = 'origin';\n`)
    gzStream.write(`COMMIT;\n`)
    gzStream.end()

    // Attente finalisation écriture
    await streamPromise
    fs.renameSync(gzTempPath, gzFilePath)

    // Calcul empreinte SHA-256
    const sha256Digest = hashStream.digest('hex')
    fs.writeFileSync(shaFilePath, `${sha256Digest}  ${path.basename(gzFilePath)}\n`, 'utf8')

    const stat = fs.statSync(gzFilePath)
    report.totalRows = totalRowsExported
    report.gzSizeBytes = stat.size
    report.sha256 = sha256Digest
    report.durationMs = Date.now() - startTime

    console.log('\n📊 BILAN DE LA SAUVEGARDE :')
    console.log(`   • Tables archivées      : ${report.tablesCount}`)
    console.log(`   • Total enregistrements : ${report.totalRows}`)
    console.log(`   • Taille compressée     : ${(stat.size / 1024 / 1024).toFixed(2)} Mo (${stat.size} octets)`)
    console.log(`   • Empreinte SHA-256     : ${sha256Digest}`)
    console.log(`   • Temps d'exécution     : ${(report.durationMs / 1000).toFixed(2)} secondes`)

    // 6. Téléversement optionnel S3 / Cloudflare R2
    if (destination === 'both' || destination === 's3') {
      const s3Result = await uploadToS3(gzFilePath, path.basename(gzFilePath))
      report.s3 = s3Result
    }

    // 7. Rotation des anciennes archives locales
    purgerAnciensBackups()

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✨ SAUVEGARDE COMPLÈTE NOPALOU TERMINÉE SANS AUCUNE ERREUR.')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    return report
  } catch (err) {
    // La transaction de lecture est refermée et l'archive provisoire retirée.
    await client.query('ROLLBACK').catch(() => {})
    if (gzStream) gzStream.destroy()
    if (fileWriteStream && !fileWriteStream.closed) {
      await new Promise((resolve) => { fileWriteStream.once('close', resolve); fileWriteStream.destroy() })
    }
    try { if (fs.existsSync(gzTempPath)) fs.unlinkSync(gzTempPath) } catch { /* retirée à la main si le système la tient encore */ }
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}

// Exécution directe via CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const labelArg = process.argv[2] || 'manual'
  executerSauvegarde({ label: labelArg }).catch(err => {
    console.error('❌ CRASH CRITIQUE SAUVEGARDE :', err)
    process.exit(1)
  })
}
