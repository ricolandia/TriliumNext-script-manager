#!/usr/bin/env node
// Smoke test da LÓGICA de trilium-plugin-manager-v4.js.
//
// O manager é um script de frontend (usa $container, api, jQuery). Aqui ele é
// executado num sandbox do Node (`vm`) com stubs mínimos de DOM/jQuery, para
// exercitar as funções reais do arquivo — não uma cópia das regras.
//
// Uso:  node test/manager-logic-smoke.js

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const MANAGER = path.join(__dirname, '..', 'trilium-plugin-manager-v4.js');

let failures = 0;
const check = (cond, msg) => {
  if (cond) console.log('  \u2713 ' + msg);
  else { failures++; console.error('  \u2717 ' + msg); }
};

// ── Stubs ─────────────────────────────────────────────────────────
function jq() {
  const el = {
    length: 0,
    html: () => el, text: () => el, attr: () => el, css: () => el,
    find: () => el, first: () => el, on: () => el, prop: () => el,
    val: () => '', data: () => undefined, hide: () => el, show: () => el,
    empty: () => el, remove: () => el, replaceWith: () => el, after: () => el,
    appendChild: () => el,
  };
  return el;
}

const sandbox = {
  console: { log: () => {}, warn: () => {}, error: () => {} },
  setTimeout, clearTimeout, AbortController, URL,
  document: {
    createElement: () => ({ id: '', textContent: '', className: '', style: {}, appendChild() {} }),
    head: { appendChild() {} },
    body: { appendChild() {} },
  },
  window: { location: { origin: 'http://localhost:8080' } },
  $container: jq(),
  $: () => jq(),
  api: { runAsyncOnBackendWithManualTransactionHandling: async () => { throw new Error('stub'); } },
};
sandbox.globalThis = sandbox;

// Expõe as funções/estado internos (mesmo escopo) para as asserções
const EXPOSE = `
;globalThis.__pm = {
  semverGt, isSemver, validateRegistry, filterByQuery, sortList, cardHTML, isIncompatible,
  assertAllowedUrl, installWarningHtml,
  set searchQuery(v){ searchQuery = v; },
  set sortMode(v){ sortMode = v; },
  set installedMap(v){ installedMap = v; },
  set appVersion(v){ CFG.appVersion = v; },
};
`;

const src = fs.readFileSync(MANAGER, 'utf8') + EXPOSE;
vm.createContext(sandbox);
try {
  vm.runInContext(src, sandbox, { filename: MANAGER });
} catch (e) {
  console.error('  \u2717 falha ao carregar o manager no sandbox: ' + e.message);
  process.exit(1);
}
const pm = sandbox.__pm;

// ── semver ────────────────────────────────────────────────────────
console.log('semver');
check(pm.isSemver('1.0.0') && pm.isSemver('0.105.0') && pm.isSemver('1.0.0-beta'), 'isSemver aceita x.y.z e pré-release');
check(!pm.isSemver('1.0') && !pm.isSemver('v1.0.0') && !pm.isSemver('abc'), 'isSemver rejeita formatos inválidos');
check(pm.semverGt('2.0.0', '1.9.9'), 'semverGt 2.0.0 > 1.9.9');
check(pm.semverGt('0.11.0', '0.9.0'), 'semverGt 0.11.0 > 0.9.0');
check(!pm.semverGt('0.9.0', '0.11.0'), 'semverGt 0.9.0 < 0.11.0');
check(pm.semverGt('1.0.0', '1.0.0-beta'), 'semverGt estável > pré-release');
check(!pm.semverGt('1.0.0-beta', '1.0.0'), 'semverGt pré-release < estável');
check(!pm.semverGt('1.0.0', '1.0.0'), 'semverGt iguais = false');

// ── validateRegistry ──────────────────────────────────────────────
console.log('validateRegistry');
const good = { id: 'a', name: 'A', version: '1.0.0', sourceUrl: 'https://raw.githubusercontent.com/u/r/main/a.js' };
check(pm.validateRegistry([good]).invalid.length === 0, 'entrada válida passa');
check(pm.validateRegistry([good, { ...good }]).invalid.length === 1, 'id duplicado é barrado');
check(pm.validateRegistry([{ id: 'a', name: 'A', version: '1.0' }]).invalid[0].errors.length >= 2, 'versão inválida + sem URL barradas');
check(
  pm.validateRegistry([{ id: 'a', name: 'A', version: '1.0.0', sourceUrl: 'https://github.com/u/r/blob/main/a.js' }])
    .invalid[0].errors.some((e) => e.includes('raw')),
  'sourceUrl fora do raw.githubusercontent.com é barrado',
);

// ── busca e ordenação ─────────────────────────────────────────────
console.log('busca e ordenação');
const all = [
  { id: 'canvas', name: 'Canvas Tools', version: '0.9.0', author: 'ricolandia', description: 'canvas toolkit', tags: ['canvas'] },
  { id: 'pomodoro', name: 'Pomodoro', version: '0.9.0', author: 'ricolandia', description: 'timer', tags: ['timer'] },
];
pm.searchQuery = '';
check(pm.filterByQuery(all).length === 2, 'busca vazia devolve tudo');
pm.searchQuery = 'canvas';
check(pm.filterByQuery(all).length === 1 && pm.filterByQuery(all)[0].id === 'canvas', 'busca filtra por tag/descrição');
pm.searchQuery = 'ricolandia';
check(pm.filterByQuery(all).length === 2, 'busca filtra por autor');
pm.searchQuery = 'zzz';
check(pm.filterByQuery(all).length === 0, 'busca sem match devolve vazio');
pm.searchQuery = '';

pm.installedMap = new Map();
pm.sortMode = 'name';
check(pm.sortList(all)[0].id === 'canvas', 'ordenação por nome (Canvas < Pomodoro)');
pm.installedMap = new Map([['pomodoro', '0.8.0']]);
pm.sortMode = 'update';
check(pm.sortList(all)[0].id === 'pomodoro', 'ordenação "atualizações primeiro"');
pm.sortMode = 'registry';
check(pm.sortList(all)[0].id === 'canvas', 'ordem do registry preservada');

// ── cardHTML / minAppVersion / changelog ──────────────────────────
console.log('cardHTML');
pm.installedMap = new Map();
pm.appVersion = '0.100.0';
const card = pm.cardHTML({ ...good, changelog: 'corrige X' });
check(card.includes('A') && card.includes('btn-install'), 'card normal renderiza nome e botão instalar');
check(card.includes('card-changelog') && card.includes('corrige X'), 'changelog aparece no card');

const incompat = pm.cardHTML({ ...good, minAppVersion: '0.200.0' });
check(incompat.includes('card incompatible'), 'card incompatível recebe a classe');
check(incompat.includes('disabled') && incompat.includes('requer Trilium'), 'instalação bloqueada com aviso');

pm.appVersion = '0.300.0';
check(!pm.isIncompatible({ ...good, minAppVersion: '0.200.0' }), 'minAppVersion satisfeita não bloqueia');

// ── segurança (allowlist + aviso) ─────────────────────────────────
console.log('segurança');
const rawUrl = 'https://raw.githubusercontent.com/u/r/main/a.js';
check(pm.assertAllowedUrl(rawUrl) === rawUrl, 'aceita raw.githubusercontent.com');
check(pm.assertAllowedUrl('https://github.com/u/r/raw/main/a.zip'), 'aceita github.com');
for (const [bad, label] of [
  ['http://raw.githubusercontent.com/u/r/main/a.js', 'http://'],
  ['https://evil.example.com/a.js', 'host não permitido'],
  ['não é url', 'URL inválida'],
]) {
  let threw = false;
  try { pm.assertAllowedUrl(bad); } catch { threw = true; }
  check(threw, 'bloqueia ' + label);
}

const warn = pm.installWarningHtml({ id: 'a', name: 'A', version: '1.0.0', author: 'X', sourceUrl: rawUrl });
check(warn.includes('A') && warn.includes('1.0.0') && warn.includes('raw.githubusercontent.com'), 'aviso mostra nome, versão e origem');
check(warn.includes('acesso total') && warn.includes('btn-cancel') && warn.includes('btn-install'), 'aviso tem o texto de risco e os botões');
check(pm.installWarningHtml({ id: 'b', name: 'B', version: '1.0.0', zipUrl: 'https://github.com/u/r/raw/main/b.zip' }).includes('ZIP'), 'aviso identifica o fluxo ZIP');

// ── Resultado ─────────────────────────────────────────────────────
console.log('');
if (failures) {
  console.error('FALHOU: ' + failures + ' asserção(ões).');
  process.exit(1);
}
console.log('OK: lógica do manager passa nos testes.');
