#!/usr/bin/env node
// Smoke test do registry.json.
//
// Espelha validateRegistry() de trilium-plugin-manager-v4.js (mesmas regras de
// schema). Sem dependências externas.
//
// Uso:  node test/registry-smoke.js
// Sai com código != 0 se algo falhar (útil em CI).

'use strict';

const fs = require('fs');
const path = require('path');

const REGISTRY_PATH = path.join(__dirname, '..', 'registry.json');

let failures = 0;
const fail = (msg) => { failures++; console.error('  \u2717 ' + msg); };
const ok   = (msg) => console.log('  \u2713 ' + msg);

// ── Regras (espelho do manager) ───────────────────────────────────
function isSemver(v) {
  return typeof v === 'string' && /^\d+\.\d+\.\d+(?:[-+].+)?$/.test(v.trim());
}

function validateRegistry(plugins) {
  const valid = [];
  const invalid = [];
  const seen = new Set();

  for (const p of plugins) {
    const errors = [];
    if (!p || typeof p !== 'object') {
      invalid.push({ id: '(sem id)', errors: ['entrada não é um objeto'] });
      continue;
    }
    const id = p.id;
    if (!id || typeof id !== 'string') errors.push('id ausente');
    else if (seen.has(id)) errors.push('id duplicado: ' + id);
    else seen.add(id);

    if (!p.name || typeof p.name !== 'string') errors.push('name ausente');
    if (!isSemver(p.version)) errors.push('version inválida (esperado x.y.z): ' + (p.version ?? '—'));

    const urls = ['sourceUrl', 'manifestUrl', 'zipUrl'].filter((k) => p[k]);
    if (!urls.length) errors.push('nenhuma URL (sourceUrl/manifestUrl/zipUrl)');
    for (const k of urls) {
      if (!/^https?:\/\//.test(String(p[k]))) errors.push(k + ' não é http(s)');
    }
    for (const k of ['sourceUrl', 'manifestUrl']) {
      if (p[k] && !/^https:\/\/raw\.githubusercontent\.com\//.test(String(p[k]))) {
        errors.push(k + ' deve usar raw.githubusercontent.com');
      }
    }
    if (p.tags !== undefined && !Array.isArray(p.tags)) errors.push('tags deve ser um array');
    if (p.labels !== undefined && !Array.isArray(p.labels)) errors.push('labels deve ser um array');
    if (p.minAppVersion !== undefined && !isSemver(p.minAppVersion)) {
      errors.push('minAppVersion inválida (esperado x.y.z): ' + p.minAppVersion);
    }

    if (errors.length) invalid.push({ id: id || '(sem id)', errors });
    else valid.push(p);
  }
  return { valid, invalid };
}

// ── 1. O arquivo é JSON válido ────────────────────────────────────
console.log('registry.json');
let raw;
try {
  raw = fs.readFileSync(REGISTRY_PATH, 'utf8');
} catch (e) {
  fail('não foi possível ler ' + REGISTRY_PATH + ': ' + e.message);
  process.exit(1);
}

let data;
try {
  data = JSON.parse(raw);
  ok('JSON válido');
} catch (e) {
  fail('JSON inválido: ' + e.message);
  process.exit(1);
}

// ── 2. Forma de topo ──────────────────────────────────────────────
if (!data.meta || typeof data.meta !== 'object') fail('meta ausente ou não é objeto');
else ok('meta presente');

if (data.meta && data.meta.schemaVersion === undefined) {
  fail('meta.schemaVersion ausente');
} else if (data.meta) {
  ok('meta.schemaVersion = ' + data.meta.schemaVersion);
}

if (!Array.isArray(data.plugins)) {
  fail('plugins ausente ou não é array');
  process.exit(1);
}
ok('plugins é um array (' + data.plugins.length + ' entradas)');

// ── 3. Schema de cada plugin ──────────────────────────────────────
const { valid, invalid } = validateRegistry(data.plugins);
if (invalid.length) {
  fail(invalid.length + ' entrada(s) inválida(s):');
  for (const it of invalid) console.error('      - ' + it.id + ': ' + it.errors.join('; '));
} else {
  ok('todas as ' + valid.length + ' entradas passam no schema');
}

// ── 4. Auto-teste das regras (garante que o validador realmente barra) ──
const negatives = [
  [{ id: 'x' }, 'sem name/version/url'],
  [{ id: 'x', name: 'X', version: '1.0', sourceUrl: 'https://raw.githubusercontent.com/a/b/main/x.js' }, 'version não-semver'],
  [{ id: 'x', name: 'X', version: '1.0.0' }, 'sem nenhuma URL'],
  [{ id: 'x', name: 'X', version: '1.0.0', sourceUrl: 'https://github.com/a/b/blob/main/x.js' }, 'sourceUrl fora do raw'],
  [{ id: 'x', name: 'X', version: '1.0.0', zipUrl: 'ftp://a/b.zip' }, 'URL não http(s)'],
  [{ id: 'x', name: 'X', version: '1.0.0', manifestUrl: 'https://raw.githubusercontent.com/a/b/main/m.json', minAppVersion: 'um' }, 'minAppVersion inválida'],
];
let negativesPassed = true;
for (const [entry, label] of negatives) {
  if (validateRegistry([entry]).invalid.length === 0) { negativesPassed = false; fail('não barrou caso negativo: ' + label); }
}
if (negativesPassed) ok('validador barra os casos negativos esperados');

// duplicidade
const dup = validateRegistry([
  { id: 'x', name: 'X', version: '1.0.0', sourceUrl: 'https://raw.githubusercontent.com/a/b/main/x.js' },
  { id: 'x', name: 'X2', version: '1.0.0', sourceUrl: 'https://raw.githubusercontent.com/a/b/main/x2.js' },
]);
if (dup.invalid.some((it) => it.errors.some((e) => e.includes('duplicado')))) ok('validador barra id duplicado');
else fail('não barrou id duplicado');

// ── Resultado ─────────────────────────────────────────────────────
console.log('');
if (failures) {
  console.error('FALHOU: ' + failures + ' problema(s).');
  process.exit(1);
}
console.log('OK: registry.json válido.');
