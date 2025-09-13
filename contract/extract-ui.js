#!/usr/bin/env node
/**
 * UI契約の自動抽出（Zod/ASTライト版）
 * - app/api 下の route.ts から Zod スキーマと Supabase POST先テーブル名を抽出
 * - UIが期待して書き込むカラム名/型/nullable を収集し、contract/ui.json を生成
 * - 失敗時は lib/contracts/ui-contract.json にフォールバック
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const API_DIR = path.join(ROOT, 'app', 'api');
const FALLBACK_SRC = path.join(ROOT, 'lib', 'contracts', 'ui-contract.json');
const OUT = path.join(ROOT, 'contract', 'ui.json');

function listRouteFiles(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) out.push(...listRouteFiles(full));
    else if (entry === 'route.ts') out.push(full);
  }
  return out;
}

function normalizeZodType(z) {
  const src = z;
  if (/z\.string\(\)\.uuid\(\)/.test(src)) return { type: 'uuid', nullable: false };
  if (/z\.string\(\)/.test(src)) return { type: 'string', nullable: false };
  if (/z\.number\(\)/.test(src)) return { type: 'number', nullable: false };
  if (/z\.(any|unknown)\(\)/.test(src)) return { type: 'json', nullable: false };
  if (/z\.enum\(/.test(src)) return { type: 'string', nullable: false };
  // default
  return { type: 'string', nullable: false };
}

function applyOptional(info, src) {
  // optional() means "omittable in request", not null in DB
  // nullable()/nullish() indicates actual null allowance
  const allowsNull = /\.(nullable|nullish)\(\)/.test(src);
  return { ...info, nullable: allowsNull ? true : false };
}

function parseZodObject(objSrc) {
  // objSrc: 'z.object({\n  key: z.string().optional(),\n  ...\n})'
  const bodyMatch = objSrc.match(/z\.object\s*\((\s*\{([\s\S]*)\}\s*)\)/);
  const columns = {};
  if (!bodyMatch) return columns;
  const body = bodyMatch[2];
  // very light parser over lines
  // also catch nested array object fields for manifests.agents
  const lines = body.split(/\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // key: z.xxx()
    let m = line.match(/^(\w+)\s*:\s*(z\.[^,]+)(,?)/);
    if (m) {
      const key = m[1];
      let zsrc = m[2];
      // If array detected but without inline object, read forward to include following lines
      if (/^z\.array\(/.test(zsrc)) {
        let frag = zsrc;
        let paren = (frag.match(/\(/g) || []).length - (frag.match(/\)/g) || []).length;
        let j = i;
        while (paren > 0 && j + 1 < lines.length) {
          j++;
          frag += lines[j];
          paren += (lines[j].match(/\(/g) || []).length - (lines[j].match(/\)/g) || []).length;
        }
        // try to capture inner object
        const innerObj = frag.match(/z\.object\s*\((\s*\{([\s\S]*)\}\s*)\)/);
        if (innerObj) {
          const innerBody = innerObj[2];
          const innerLines = innerBody.split(/\n/);
          for (const il of innerLines) {
            const m2 = il.trim().match(/^(\w+)\s*:\s*(z\.[^,]+)(,?)/);
            if (m2) {
              const ikey = m2[1];
              const info = applyOptional(normalizeZodType(m2[2]), m2[2]);
              columns[ikey] = info.nullable ? { type: info.type, nullable: true } : { type: info.type };
            }
          }
        }
        // advance cursor to where we consumed
        i = j;
        continue; // do not add the array key itself
      }
      
      const info = applyOptional(normalizeZodType(zsrc), zsrc);
      columns[key] = info.nullable ? { type: info.type, nullable: true } : { type: info.type };
    }
  }
  return columns;
}

function findFirstZodObject(src) {
  const idx = src.indexOf('z.object(');
  if (idx === -1) return null;
  // crude brace matching to capture full z.object({ ... })
  let i = idx;
  let depth = 0;
  let out = '';
  let started = false;
  while (i < src.length) {
    const ch = src[i++];
    out += ch;
    if (ch === '(') { depth++; started = true; }
    if (ch === ')') { depth--; }
    if (started && depth === 0) break;
  }
  return out;
}

function extractContractFromApi() {
  const files = listRouteFiles(API_DIR);
  const tables = {};
  for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    const m = src.match(/\/rest\/v1\/([a-zA-Z_][a-zA-Z0-9_]*)/);
    if (!m) continue;
    const table = m[1];
    const zobj = findFirstZodObject(src);
    if (!zobj) continue;
    const cols = parseZodObject(zobj);
    if (Object.keys(cols).length === 0) continue;
    tables[table] = { columns: cols };
  }
  return { tables };
}

function main() {
  let contract = null;
  try {
    contract = extractContractFromApi();
  } catch (e) {
    console.warn('Zod-based extraction failed. Falling back to static UI contract.', e);
  }

  if (!contract || !Object.keys(contract.tables || {}).length) {
    if (!fs.existsSync(FALLBACK_SRC)) {
      throw new Error('No UI contract could be generated.');
    }
    contract = JSON.parse(fs.readFileSync(FALLBACK_SRC, 'utf8'));
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(contract, null, 2));
  console.log(`Wrote UI contract: ${path.relative(ROOT, OUT)}`);
}

main();
