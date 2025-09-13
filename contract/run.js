#!/usr/bin/env node
/**
 * Runs contract extraction and validation.
 * - Generates contract/db.json and contract/ui.json
 * - Compares UI expectations against DB schema
 * - Exits non‑zero on mismatch
 */
const { spawnSync } = require('node:child_process');
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const DB_JSON = path.join(ROOT, 'contract', 'db.json');
const UI_JSON = path.join(ROOT, 'contract', 'ui.json');

function run(cmd, args) {
  const res = spawnSync(cmd, args, { stdio: 'inherit' });
  if (res.status !== 0) {
    process.exit(res.status || 1);
  }
}

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function diffContracts(ui, db) {
  const issues = [];
  const uiTables = ui.tables || {};
  const dbTables = db.tables || {};

  const typeCompat = (uiType, dbCol) => {
    // uiType may be a string or object
    const want = typeof uiType === 'string' ? { type: uiType } : uiType;
    const got = dbCol || {};
    const wType = (want.type || '').toLowerCase();
    const gType = (got.type || '').toLowerCase();

    // Basic equivalence / compatibility rules
    if (wType === 'string' && (gType === 'string' || gType === 'enum')) return true;
    if (wType === 'uuid' && gType === 'string' && got.format === 'uuid') return true;
    if (wType === 'timestamp' && gType === 'string' && got.format === 'date-time') return true;
    if (wType === 'json' && gType === 'json') return true;
    if (wType === gType) return true;
    return false;
  };

  for (const [tName, tSpec] of Object.entries(uiTables)) {
    if (!dbTables[tName]) {
      issues.push(`Missing table in DB: ${tName}`);
      continue;
    }
    const uiCols = tSpec.columns || {};
    const dbCols = dbTables[tName].columns || {};
    for (const [cName, cSpec] of Object.entries(uiCols)) {
      const dbCol = dbCols[cName];
      if (!dbCol) {
        issues.push(`Missing column in DB: ${tName}.${cName}`);
        continue;
      }
      const uiType = typeof cSpec === 'string' ? cSpec : cSpec.type;
      if (!typeCompat(uiType, dbCol)) {
        issues.push(
          `Type mismatch: ${tName}.${cName} (ui:${uiType} vs db:${dbCol.type}${dbCol.format ? '/' + dbCol.format : ''})`
        );
      }
      if (typeof cSpec === 'object' && cSpec.nullable !== undefined) {
        const wantNullable = !!cSpec.nullable;
        const gotNullable = !!dbCol.nullable;
        if (wantNullable !== gotNullable) {
          issues.push(`Nullability mismatch: ${tName}.${cName} (ui:${wantNullable} vs db:${gotNullable})`);
        }
      }
    }
  }

  return issues;
}

function main() {
  // 1) Extract snapshots
  run('node', [path.join('contract', 'extract-db.js')]);
  run('node', [path.join('contract', 'extract-ui.js')]);

  // 2) Validate
  const db = loadJson(DB_JSON);
  const ui = loadJson(UI_JSON);
  const issues = diffContracts(ui, db);
  if (issues.length) {
    console.error('\nUI–DB Contract Mismatches:');
    for (const i of issues) console.error(`- ${i}`);
    console.error('\nContract Invalid ✗');
    process.exit(1);
  }
  console.log('\nContract Valid ✓');
}

main();

