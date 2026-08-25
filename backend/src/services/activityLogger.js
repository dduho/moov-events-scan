'use strict'

const _origEmitWarning = process.emitWarning.bind(process)
process.emitWarning = (warning, ...rest) => {
  if (typeof warning === 'string' && warning.includes('SQLite')) return
  return _origEmitWarning(warning, ...rest)
}
const { DatabaseSync } = require('node:sqlite')
process.emitWarning = _origEmitWarning

const path = require('path')
const fs   = require('fs')

const DATA_DIR    = path.join(__dirname, '../../data')
const HOT_DB_FILE = path.join(DATA_DIR,  'activity_logs.db')

const CURRENT_ENV = process.env.NODE_ENV === 'test' ? 'test' : 'prod'

const LEVELS = { info: 'info', success: 'success', warning: 'warning', error: 'error' }
const TYPES  = { system: 'system', scan: 'scan' }

let _db = null

function getDb() {
  if (_db) return _db
  fs.mkdirSync(DATA_DIR, { recursive: true })
  _db = new DatabaseSync(HOT_DB_FILE)
  _db.exec(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id          TEXT    PRIMARY KEY,
      timestamp   TEXT    NOT NULL,
      app         TEXT    NOT NULL DEFAULT 'moov-events-scan',
      env         TEXT,
      type        TEXT    NOT NULL DEFAULT 'system',
      level       TEXT    NOT NULL DEFAULT 'info',
      action      TEXT    NOT NULL DEFAULT '',
      msisdn      TEXT,
      amount      REAL,
      reference   TEXT,
      status      TEXT,
      http_status INTEGER,
      duration_ms INTEGER,
      meta        TEXT,
      user_id     TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_ts    ON activity_logs(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_type  ON activity_logs(type);
    CREATE INDEX IF NOT EXISTS idx_level ON activity_logs(level);
  `)
  try { _db.exec(`ALTER TABLE activity_logs ADD COLUMN env TEXT`) } catch { /* colonne deja presente */ }
  try { _db.exec(`CREATE INDEX IF NOT EXISTS idx_env ON activity_logs(env)`) } catch { /* best-effort */ }
  return _db
}

function log(entry) {
  try {
    const db  = getDb()
    const rec = {
      id:          `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp:   new Date().toISOString(),
      app:         entry.app        || 'moov-events-scan',
      env:         entry.env        || CURRENT_ENV,
      type:        entry.type       || TYPES.system,
      level:       entry.level      || LEVELS.info,
      action:      entry.action     || '',
      msisdn:      entry.msisdn     || null,
      amount:      entry.amount     !== undefined ? Number(entry.amount) : null,
      reference:   entry.reference  || null,
      status:      entry.status     || null,
      http_status: entry.httpStatus || null,
      duration_ms: entry.durationMs || null,
      meta:        entry.meta       ? JSON.stringify(entry.meta) : null,
      user_id:     entry.userId     || null,
    }
    db.prepare(`
      INSERT INTO activity_logs
        (id,timestamp,app,env,type,level,action,msisdn,amount,reference,status,http_status,duration_ms,meta,user_id)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(rec.id, rec.timestamp, rec.app, rec.env, rec.type, rec.level, rec.action,
           rec.msisdn, rec.amount, rec.reference, rec.status,
           rec.http_status, rec.duration_ms, rec.meta, rec.user_id)
    return rec
  } catch (err) {
    console.error('[activityLogger/log]', err.message)
    return null
  }
}

try {
  getDb()
} catch (err) {
  console.error('[activityLogger] Erreur d\'initialisation:', err.message)
}

module.exports = { log, LEVELS, TYPES }
