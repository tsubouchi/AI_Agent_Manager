#!/usr/bin/env node
/**
 * Extracts a simplified DB schema contract from Supabase SQL migrations.
 * Output: contract/db.json
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const MIGRATIONS_DIR = path.join(ROOT, 'supabase', 'migrations');
const OUT_PATH = path.join(ROOT, 'contract', 'db.json');

/** Normalize PostgreSQL type to a canonical domain type */
function normalizeType(pgType, enums) {
  const t = pgType.trim().toLowerCase();
  if (t.startsWith('uuid')) return { type: 'string', format: 'uuid' };
  if (t.startsWith('timestamptz') || t.startsWith('timestamp')) return { type: 'string', format: 'date-time' };
  if (t === 'date' || t.startsWith('date')) return { type: 'string', format: 'date' };
  if (t.startsWith('text') || t.startsWith('varchar') || t.startsWith('character varying')) return { type: 'string' };
  if (t.startsWith('jsonb') || t === 'json') return { type: 'json' };
  if (t === 'int' || t === 'integer' || t === 'bigint' || t === 'smallint') return { type: 'number', format: 'int' };
  if (t === 'numeric' || t.startsWith('decimal')) return { type: 'number' };
  if (t === 'boolean' || t === 'bool') return { type: 'boolean' };
  if (enums[t]) return { type: 'enum', name: t, values: enums[t] };
  return { type: t };
}

function parseMigrations() {
  const enums = {};
  const tables = {};
  if (!fs.existsSync(MIGRATIONS_DIR)) return { enums, tables };
  const files = fs.readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql')).sort();
  for (const file of files) {
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    // Parse CREATE TYPE ... AS ENUM (...)
    const enumRe = /create\s+type\s+(\w+)\s+as\s+enum\s*\(([^\)]*)\)/gim;
    let m;
    while ((m = enumRe.exec(sql)) !== null) {
      const name = m[1].toLowerCase();
      const vals = m[2]
        .split(',')
        .map(s => s.trim())
        .map(s => s.replace(/^'/, '').replace(/'$/, ''))
        .filter(Boolean);
      enums[name] = vals;
    }

    // Parse CREATE TABLE ... ( ... ); blocks
    const tableRe = /create\s+table\s+if\s+not\s+exists\s+(\w+)\s*\(([^;]*)\);/gim;
    let tmatch;
    while ((tmatch = tableRe.exec(sql)) !== null) {
      const tableName = tmatch[1];
      const body = tmatch[2];
      const lines = body
        .split(/\n|,/)
        .map(l => l.trim())
        .filter(l => l.length > 0);

      const columns = {};
      for (const line of lines) {
        // Skip constraints-only lines if any appear
        if (line.toLowerCase().startsWith('constraint')) continue;

        // Pattern: name type [constraints ...] [references table(col) ...]
        const parts = line.split(/\s+/);
        const colName = parts[0];
        // Skip lines that don't look like a column definition
        if (!colName || colName.includes('(')) continue;

        const type = parts[1] || '';
        const lower = line.toLowerCase();
        const notNull = lower.includes('not null') || lower.includes('primary key');
        const nullable = !notNull;

        let ref = null;
        const refRe = /references\s+(\w+)\s*\((\w+)\)/i;
        const r = refRe.exec(line);
        if (r) {
          ref = { table: r[1], column: r[2] };
        }

        columns[colName] = {
          ...normalizeType(type, enums),
          nullable,
          ...(ref ? { references: ref } : {}),
        };
      }

      tables[tableName] = { columns };
    }
  }
  return { enums, tables };
}

function main() {
  const { enums, tables } = parseMigrations();
  const out = { enums, tables };
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2));
  console.log(`Wrote DB contract: ${path.relative(ROOT, OUT_PATH)}`);
}

main();
