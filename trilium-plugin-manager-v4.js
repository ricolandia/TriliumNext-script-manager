// ════════════════════════════════════════════════════════════════
//  TriliumNext Plugin Manager — Render Note (JS Frontend)
// ════════════════════════════════════════════════════════════════
//  Modo de usar:
//    1. Crie uma nota do tipo "Code" com MIME "application/javascript;env=frontend"
//    2. Cole este código
//    3. Adicione ~renderNote apontando para a nota onde quer exibir o painel
//    4. Abra a nota de destino (ou a nota Render, se for nota separada)
// ════════════════════════════════════════════════════════════════

const $root = $container;

// CSS próprio do manager, injetado no <head> — imune a sanitização de render
// notes e a temas sem regras de card (ex.: instâncias sem o tema Folio).
const PM_CSS = `
  /* ── Variáveis: herda o tema do Trilium, com fallbacks ── */
#pm-root {
    --bg:       var(--main-background-color,   #16161e);
    --surface:  var(--accented-background-color, #1f1f2e);
    --border:   var(--main-border-color,         #2e2e42);
    --text:     var(--main-text-color,           #c0caf5);
    --muted:    var(--muted-text-color,          #565f89);
    --accent:   #7aa2f7;
    --green:    #9ece6a;
    --red:      #f7768e;
    --yellow:   #e0af68;
    --r:        8px;
    --mono:     'JetBrains Mono', 'Fira Mono', monospace;
  }

#pm-root *, #pm-root *::before, #pm-root *::after { box-sizing: border-box; margin: 0; padding: 0; }

#pm-root {
    font-family: var(--font-family, 'Segoe UI', system-ui, sans-serif);
    background: transparent;
    color: var(--text);
    padding: 20px 24px 40px;
    font-size: 14px;
  }

  /* ── Header ── */
#pm-root .header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: 20px;
    padding-bottom: 14px;
    border-bottom: 1px solid var(--border);
  }
#pm-root .header-left h1 {
    font-size: 1.25rem;
    font-weight: 700;
    letter-spacing: -0.3px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
#pm-root .header-left p {
    color: var(--muted);
    font-size: 0.8rem;
    margin-top: 3px;
  }
#pm-root .btn-refresh {
    padding: 5px 12px;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: var(--r);
    color: var(--muted);
    font-size: 0.8rem;
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s;
  }
#pm-root .btn-refresh:hover { color: var(--text); border-color: var(--accent); }

  /* ── Config banner ── */
#pm-root .banner {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    border-radius: var(--r);
    margin-bottom: 20px;
    font-size: 0.82rem;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--muted);
    transition: all 0.2s;
  }
#pm-root .banner.ok { border-color: var(--green); color: var(--green); }
#pm-root .banner.warn { border-color: var(--yellow); color: var(--yellow); }
#pm-root .banner.error { border-color: var(--red);   color: var(--red); }
#pm-root .banner .dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    background: currentColor;
    flex-shrink: 0;
  }

  /* ── Grid de cards ── */
#pm-root .cat-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 16px;
  }
#pm-root .cat-pill {
    padding: 4px 12px;
    border-radius: 99px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--muted);
    font-size: 0.78rem;
    cursor: pointer;
    transition: border-color 0.15s, color 0.15s, background 0.15s;
  }
#pm-root .cat-pill:hover { border-color: var(--accent); color: var(--text); }
#pm-root .cat-pill.active { border-color: var(--accent); background: var(--accent); color: #16161e; font-weight: 600; }

#pm-root .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
    gap: 14px;
  }

#pm-root .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r);
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    transition: border-color 0.15s, transform 0.1s;
  }
#pm-root .card:hover { border-color: var(--accent); transform: translateY(-1px); }
#pm-root .card.is-installed { border-color: var(--green); }

#pm-root .card-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px;
  }
#pm-root .card-name {
    font-weight: 600;
    font-size: 0.95rem;
  }
#pm-root .card-version {
    font-family: var(--mono);
    font-size: 0.72rem;
    color: var(--muted);
    background: var(--bg);
    padding: 2px 8px;
    border-radius: 99px;
    white-space: nowrap;
    border: 1px solid var(--border);
  }
#pm-root .card-author {
    font-size: 0.78rem;
    color: var(--muted);
  }
#pm-root .card-desc {
    font-size: 0.85rem;
    line-height: 1.55;
    color: var(--text);
    flex-grow: 1;
  }
#pm-root .card-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }
#pm-root .tag {
    font-size: 0.7rem;
    padding: 2px 8px;
    border-radius: 99px;
    background: var(--bg);
    border: 1px solid var(--border);
    color: var(--muted);
  }
#pm-root .card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding-top: 6px;
    border-top: 1px solid var(--border);
    margin-top: auto;
  }
#pm-root .badge-ok {
    font-size: 0.75rem;
    color: var(--green);
    display: flex;
    align-items: center;
    gap: 5px;
  }

  /* ── Botões ── */
#pm-root .btn {
    padding: 6px 14px;
    border-radius: 6px;
    border: none;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.15s, transform 0.1s;
  }
#pm-root .btn:hover:not(:disabled) { opacity: 0.85; transform: scale(0.98); }
#pm-root .btn:disabled { opacity: 0.45; cursor: not-allowed; }

#pm-root .btn-install {
    background: var(--accent);
    color: #16161e;
  }
#pm-root .btn-reinstall {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--muted);
    font-size: 0.75rem;
  }
#pm-root .btn-reinstall:hover { border-color: var(--accent); color: var(--accent); }
#pm-root .btn-download {
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--muted);
  }
#pm-root .btn-download:hover { border-color: var(--accent); color: var(--accent); }
#pm-root .btn-howto {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--muted);
    font-size: 0.75rem;
    padding: 4px 8px;
    float: left;
  }
#pm-root .btn-howto:hover { border-color: var(--accent); color: var(--accent); }

  /* ── Estados ── */
#pm-root .state-center {
    text-align: center;
    padding: 60px 20px;
    color: var(--muted);
  }
#pm-root .state-center .icon { font-size: 2rem; margin-bottom: 12px; }
#pm-root .state-center p { font-size: 0.85rem; line-height: 1.6; }
#pm-root .state-center code {
    font-family: var(--mono);
    background: var(--surface);
    padding: 1px 6px;
    border-radius: 4px;
    border: 1px solid var(--border);
    color: var(--yellow);
  }

  /* ── Toast ── */
#pm-root .toast {
    position: fixed;
    bottom: 18px; right: 18px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r);
    padding: 10px 16px;
    font-size: 0.82rem;
    z-index: 9999;
    max-width: 280px;
    animation: toastIn 0.2s cubic-bezier(.22,1,.36,1);
  }
#pm-root .toast.ok { border-color: var(--green); color: var(--green); }
#pm-root .toast.error { border-color: var(--red);   color: var(--red); }
  @keyframes toastIn {
#pm-root from { transform: translateY(14px); opacity: 0; }
#pm-root to { transform: translateY(0);    opacity: 1; }
  }

  /* ── Source pill (remote/local) ── */
#pm-root .source-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 18px;
    font-size: 0.78rem;
    color: var(--muted);
  }
#pm-root .source-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 2px 10px;
    border-radius: 99px;
    border: 1px solid var(--border);
    background: var(--surface);
    font-family: var(--mono);
    font-size: 0.72rem;
    color: var(--muted);
  }
#pm-root .source-pill.remote { border-color: var(--accent); color: var(--accent); }
#pm-root .source-pill.local { border-color: var(--yellow); color: var(--yellow); }
#pm-root .source-pill.error { border-color: var(--red);    color: var(--red); }
#pm-root .source-pill .icon-s { font-style: normal; }

#pm-root .badge-update {
    font-size: 0.75rem;
    color: var(--yellow);
    display: flex;
    align-items: center;
    gap: 5px;
  }
#pm-root .btn-update {
    background: var(--yellow);
    color: #16161e;
    font-size: 0.82rem;
  }
#pm-root .card.has-update { border-color: var(--yellow); }

#pm-root .btn-uninstall {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--red);
    font-size: 0.75rem;
    padding: 6px 10px;
  }
#pm-root .btn-uninstall:hover { border-color: var(--red); background: color-mix(in srgb, var(--red) 10%, transparent); }

  /* ── Spinner inline ── */
#pm-root .spinner {
    display: inline-block;
    width: 10px; height: 10px;
    border: 2px solid currentColor;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
    vertical-align: middle;
    margin-right: 4px;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── Toolbar: busca + ordenação ── */
#pm-root .toolbar {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
    flex-wrap: wrap;
  }
#pm-root .pm-search {
    flex: 1 1 220px;
    min-width: 180px;
    padding: 7px 12px;
    border-radius: var(--r);
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text);
    font-size: 0.82rem;
    font-family: inherit;
  }
#pm-root .pm-search::placeholder { color: var(--muted); }
#pm-root .pm-search:focus { outline: none; border-color: var(--accent); }
#pm-root .pm-sort {
    padding: 7px 10px;
    border-radius: var(--r);
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text);
    font-size: 0.8rem;
    font-family: inherit;
    cursor: pointer;
  }
#pm-root .pm-sort:focus { outline: none; border-color: var(--accent); }

  /* ── Card incompatível (minAppVersion) ── */
#pm-root .card.incompatible { border-color: var(--yellow); border-style: dashed; }
#pm-root .badge-minapp {
    font-size: 0.72rem;
    color: var(--yellow);
    font-family: var(--mono);
  }

  /* ── Changelog no card ── */
#pm-root .card-changelog {
    font-size: 0.76rem;
    color: var(--muted);
    line-height: 1.5;
    white-space: pre-line;
    border-top: 1px dashed var(--border);
    padding-top: 6px;
  }

  /* ── Painel de entradas inválidas ── */
#pm-root .invalid-panel {
    border: 1px dashed var(--red);
    border-radius: var(--r);
    padding: 10px 14px;
    margin-bottom: 16px;
    font-size: 0.78rem;
    color: var(--muted);
    background: var(--surface);
    line-height: 1.6;
  }
#pm-root .invalid-panel strong { color: var(--red); }
#pm-root .invalid-panel ul { margin: 6px 0 0; padding-left: 18px; }
#pm-root .invalid-panel code { font-family: var(--mono); color: var(--yellow); }

  /* ── Modal de confirmação de instalação ── */
#pm-root .pm-modal {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.55);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 20px;
  }
#pm-root .pm-modal-box {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r);
    max-width: 460px;
    width: 100%;
    padding: 18px 20px;
    box-shadow: 0 12px 40px rgba(0,0,0,0.4);
  }
#pm-root .pm-modal-title { font-size: 1rem; font-weight: 700; margin-bottom: 10px; }
#pm-root .pm-modal-body { font-size: 0.85rem; line-height: 1.6; }
#pm-root .pm-modal-body .kv { display: flex; gap: 8px; font-size: 0.8rem; color: var(--muted); margin-top: 4px; }
#pm-root .pm-modal-body .kv b { color: var(--text); font-weight: 600; }
#pm-root .pm-modal-warn {
    margin-top: 12px;
    padding: 10px 12px;
    border: 1px solid var(--yellow);
    border-radius: var(--r);
    color: var(--yellow);
    font-size: 0.8rem;
    line-height: 1.5;
  }
#pm-root .pm-modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
#pm-root .pm-modal-actions .btn-cancel {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--muted);
  }
#pm-root .pm-modal-actions .btn-cancel:hover { color: var(--text); border-color: var(--accent); }
`;

try {
  if (typeof document !== 'undefined') {
    const pmStyle = document.createElement('style');
    pmStyle.id = 'pm-manager-css';
    pmStyle.textContent = PM_CSS;
    document.head.appendChild(pmStyle);
  }
} catch (e) { console.warn('[PluginManager] css inject failed:', e); }

$root.html(`


<div id="pm-root" class="pm-container">

<div class="header">
  <div class="header-left">
    <h1>🧩 Gerenciador de Scripts & Widgets</h1>
    <p>Gerencie scripts, widgets e render notes do TriliumNext</p>
  </div>
  <button class="btn-refresh">↻ Atualizar</button>
</div>

<div id="banner" class="banner">
  <div class="dot"></div>
  <span>Inicializando...</span>
</div>

<div id="source-bar" class="source-bar" style="display:none">
  <span>Registry:</span>
  <span id="source-pill" class="source-pill"></span>
  <span id="source-ts"></span>
</div>

<div id="pm-toolbar" class="toolbar" style="display:none">
  <input id="pm-search" class="pm-search" type="search" autocomplete="off"
         placeholder="Buscar por nome, autor, descrição ou tag…">
  <select id="pm-sort" class="pm-sort">
    <option value="registry">Ordem do registry</option>
    <option value="name">Nome (A–Z)</option>
    <option value="update">Atualizações primeiro</option>
    <option value="installed">Instalados primeiro</option>
  </select>
</div>

<div id="invalid-panel" class="invalid-panel" style="display:none"></div>

<div id="content">
  <div class="state-center"><div class="icon">⏳</div><p>Carregando registry...</p></div>
</div>

<div id="pm-modal" class="pm-modal" style="display:none"></div>

</div>
`);

// ════════════════════════════════════════════════════════════════
//  CONFIG — atributos (labels) necessários no Trilium:
//
//  Na nota com #pluginRegistry:
//    #etapiToken    → token gerado em Options > ETAPI  (opcional — só necessário se o registry usar zipUrl)
//    #triliumPort   → porta do Trilium (padrão: 37840) (opcional)
//    #registryUrl   → URL remota do JSON do registry   (opcional)
//                     ex: https://gist.githubusercontent.com/user/id/raw/registry.json
//                     Se ausente, usa o conteúdo local da nota como fallback.
//
//  Notas com esses atributos:
//    #installedPlugins  → nota "Installed" (recebe os imports de ZIP)
//    #pluginRegistry    → nota com JSON local + labels de config
// ════════════════════════════════════════════════════════════════

let CFG = {};
let installedMap = new Map();
let pluginsMap = {};
let activeCategory = 'all';
let allPlugins = [];
let searchQuery = '';
let sortMode = 'registry';

const CATEGORIES = [
  { id: 'all',      label: 'Todos' },
  { id: 'widget',   label: 'Widget',   match: ['widget', 'pomodoro', 'timer', 'word', 'counter', 'ai', 'chat', 'openrouter'] },
  { id: 'canvas',   label: 'Canvas',   match: ['canvas', 'excalidraw', 'visual', 'templates'] },
  { id: 'writing',  label: 'Escrita',  match: ['writing', 'screenplay', 'comics', 'render', 'export', 'longform'] },
  { id: 'ui',       label: 'UI',       match: ['kanban', 'planning', 'board', 'productivity'] },
  { id: 'tools',    label: 'Ferramentas', match: ['notes', 'cleaner', 'attribute', 'share', 'comment', 'network'] },
];

// ── INIT ─────────────────────────────────────────────────────────
async function init() {
  setBanner('Conectando ao backend...', '');
  setContent('<div class="state-center"><div class="icon">⏳</div><p>Carregando...</p></div>');
  $root.find('#source-bar').hide();

  try {
    const data = await api.runAsyncOnBackendWithManualTransactionHandling(async () => {
      const registryNote  = api.getNoteWithLabel('pluginRegistry');
      const installedNote = api.getNoteWithLabel('installedPlugins');

      if (!registryNote)  throw new Error('Nota com #pluginRegistry não encontrada.');
      if (!installedNote) throw new Error('Nota com #installedPlugins não encontrada.');

      const etapiToken  = registryNote.getAttribute('label', 'etapiToken')?.value;
      const port        = parseInt(registryNote.getAttribute('label', 'triliumPort')?.value || '0') || 37840;
      const registryUrl = registryNote.getAttribute('label', 'registryUrl')?.value || null;

      // Plugins já instalados — retorna { id → version }
      const installedChildren = await installedNote.getChildNotes();
      const installedVersions = {};
      for (const n of installedChildren) {
        const id  = n.getAttribute('label', 'pluginId')?.value;
        const ver = n.getAttribute('label', 'pluginVersion')?.value || '0.0.0';
        if (id) installedVersions[id] = ver;
      }

      // ── Fetch do registry: remoto com fallback local ──────────
      let registryContent = null;
      let source          = 'local';    // 'remote' | 'local' | 'fallback'
      let fetchError      = null;
      let fetchedAt       = new Date().toISOString();

      if (registryUrl) {
        try {
          const resp = await fetch(registryUrl, {
            headers: { 'Cache-Control': 'no-cache' }   // sempre busca versão fresca
          });
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
          registryContent = await resp.text();
          source = 'remote';
        } catch (err) {
          fetchError = err.message;
          source = 'fallback';
          // cai no conteúdo local abaixo
        }
      }

      if (!registryContent) {
        registryContent = await registryNote.getContent();
        if (source !== 'fallback') source = 'local';
      }

      return {
        etapiToken,
        port,
        registryUrl,
        installedNoteId: installedNote.noteId,
        installedVersions,
        registry: registryContent,
        source,
        fetchError,
        fetchedAt,
        serverOrigin: registryNote.getAttribute('label', 'serverOrigin')?.value || null,
        appVersion: (() => { try { return api.getAppInfo().appVersion; } catch { return null; } })()
      };
    }, []);

    CFG = {
      etapiToken:      data.etapiToken,
      port:            data.port,
      installedNoteId: data.installedNoteId,
      serverOrigin:    data.serverOrigin || window.location.origin,
      appVersion:      data.appVersion || null
    };
    installedMap = new Map(Object.entries(data.installedVersions));

    // Valida token (opcional — só necessário para registry com zipUrl)
    if (!CFG.etapiToken) {
      setBanner('Token ETAPI não configurado. Instalação via sourceUrl funciona sem ele, mas scripts/widgets zipUrl exigem token em Options > ETAPI.', 'warn');
    }

    let plugins = [];
    try { plugins = JSON.parse(data.registry).plugins || []; }
    catch { setBanner('Erro ao parsear o JSON do registry.', 'error'); return; }

    const validation = validateRegistry(plugins);
    renderInvalidNotice(validation.invalid);
    plugins = validation.valid;

    const updateCount = plugins.filter(p =>
      installedMap.has(p.id) && semverGt(p.version, installedMap.get(p.id))
    ).length;

    const updateNote  = updateCount > 0 ? ` · 🔔 ${updateCount} update(s) disponível(is)` : '';
    const invalidNote = validation.invalid.length > 0 ? ` · ⚠ ${validation.invalid.length} entrada(s) inválida(s)` : '';
    setBanner(
      `Conectado · porta ${CFG.port} · ${installedMap.size} script(s)/widget(s) instalado(s)${updateNote}${invalidNote}`,
      (updateCount > 0 || validation.invalid.length > 0) ? 'warn' : 'ok'
    );

    setSourcePill(data.source, data.registryUrl, data.fetchedAt, data.fetchError);
    allPlugins = plugins;
    activeCategory = 'all';
    $root.find('#pm-toolbar').css('display', 'flex');
    renderCategoryBar();
    applyView();

  } catch (err) {
    setBanner('Erro: ' + err.message, 'error');
    setContent('<div class="state-center"><div class="icon">⚠</div><p>' + escHtml(err.message) + '</p></div>');
    console.error('[PluginManager]', err);
  }
}

// ── SOURCE PILL ──────────────────────────────────────────────────
function setSourcePill(source, url, fetchedAt, fetchError) {
  const bar  = $root.find('#source-bar');
  const pill = $root.find('#source-pill');
  const ts   = $root.find('#source-ts');

  const labels = {
    remote:   { icon: '🌐', text: url ? shortenUrl(url) : 'remoto',    cls: 'remote' },
    local:    { icon: '📄', text: 'nota local',                         cls: 'local'  },
    fallback: { icon: '⚠', text: 'fallback local (fetch falhou)',       cls: 'error'  }
  };
  const cfg = labels[source] || labels.local;

  pill.attr('class', 'source-pill ' + cfg.cls);
  pill.html('<i class="icon-s">' + cfg.icon + '</i> ' + escHtml(cfg.text));

  const d = new Date(fetchedAt);
  const hm = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  ts.text('· atualizado às ' + hm + (fetchError ? ' · erro: ' + fetchError : ''));

  bar.css('display', 'flex');
}

function shortenUrl(url) {
  try {
    const u = new URL(url);
    const path = u.pathname.length > 30 ? u.pathname.slice(0, 28) + '…' : u.pathname;
    return u.hostname + path;
  } catch { return url.slice(0, 40) + '…'; }
}

// ── RENDER ───────────────────────────────────────────────────────
function getPluginCategory(p) {
  const tags = (p.tags || []).map(t => t.toLowerCase());
  for (const cat of CATEGORIES) {
    if (cat.id === 'all') continue;
    if (tags.some(t => cat.match.includes(t))) return cat.id;
  }
  return 'other';
}

function renderCategoryBar() {
  if (!allPlugins.length) { $root.find('#cat-bar').remove(); return; }
  let html = '<div id="cat-bar" class="cat-bar">';
  for (const cat of CATEGORIES) {
    const count = cat.id === 'all'
      ? allPlugins.length
      : allPlugins.filter(p => getPluginCategory(p) === cat.id).length;
    if (count === 0 && cat.id !== 'all') continue;
    const active = cat.id === activeCategory ? ' active' : '';
    html += `<button class="cat-pill${active}" data-cat="${cat.id}">${cat.label} (${count})</button>`;
  }
  html += '</div>';
  const existing = $root.find('#cat-bar');
  if (existing.length) existing.replaceWith(html);
  else $root.find('#pm-toolbar').after(html);
}

function filterByCategory(plugins) {
  if (activeCategory === 'all') return plugins;
  return plugins.filter(p => getPluginCategory(p) === activeCategory);
}

function filterByQuery(plugins) {
  const q = searchQuery.trim().toLowerCase();
  if (!q) return plugins;
  return plugins.filter(p => {
    const haystack = [p.name, p.author, p.description, (p.tags || []).join(' ')]
      .filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(q);
  });
}

function sortList(plugins) {
  const list = plugins.slice();
  switch (sortMode) {
    case 'name':
      return list.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
    case 'update':
      return list.sort((a, b) => {
        const ua = installedMap.has(a.id) && semverGt(a.version, installedMap.get(a.id)) ? 1 : 0;
        const ub = installedMap.has(b.id) && semverGt(b.version, installedMap.get(b.id)) ? 1 : 0;
        return ub - ua;
      });
    case 'installed':
      return list.sort((a, b) => (installedMap.has(b.id) ? 1 : 0) - (installedMap.has(a.id) ? 1 : 0));
    default:
      return list;   // ordem do registry
  }
}

function applyView() {
  renderPlugins(sortList(filterByQuery(filterByCategory(allPlugins))));
}

function renderPlugins(plugins) {
  pluginsMap = {};
  for (const p of plugins) pluginsMap[p.id] = p;
  if (!plugins.length) {
    const msg = searchQuery.trim()
      ? `Nada encontrado para <code>${escHtml(searchQuery.trim())}</code>.`
      : (activeCategory !== 'all'
          ? 'Nenhum script/widget nesta categoria.'
          : 'Edite a nota <code>#pluginRegistry</code> para adicionar scripts/widgets.');
    setContent(`<div class="state-center">
      <div class="icon">📭</div>
      <p>${msg}</p>
    </div>`);
    return;
  }
  setContent('<div class="grid">' + plugins.map(p => cardHTML(p)).join('') + '</div>');
}

function cardHTML(p) {
  const installedVer = installedMap.get(p.id);
  const isInstalled  = installedVer !== undefined;
  const hasUpdate    = isInstalled && semverGt(p.version, installedVer);
  const hasSourceUrl = !!p.sourceUrl || !!p.manifestUrl;
  const btnLabel     = hasSourceUrl ? 'Instalar' : 'Baixar ZIP';
  const btnClass     = hasSourceUrl ? 'btn-install' : 'btn-download';
  const incompatible = isIncompatible(p);

  const tagsHtml = (p.tags || []).map(t => `<span class="tag">${escHtml(t)}</span>`).join('');
  const hasHowto = !!p.homepage;

  let howtoHtml = hasHowto
    ? `<button class="btn btn-howto" data-plugin-id="${escHtml(p.id)}">📖 How to</button>`
    : '';

  let cardClass  = 'card';
  let footerHtml = '';

  if (incompatible) {
    cardClass  = 'card incompatible';
    const installBtn = isInstalled
      ? `<button class="btn btn-reinstall" data-plugin-id="${escHtml(p.id)}" disabled>↺</button>`
      : `<button class="btn ${btnClass}" data-plugin-id="${escHtml(p.id)}" disabled>${btnLabel}</button>`;
    const uninstallBtn = isInstalled
      ? `<button class="btn btn-uninstall" data-plugin-id="${escHtml(p.id)}">✕</button>`
      : '';
    footerHtml = `${howtoHtml}
      <span class="badge-minapp">requer Trilium ≥ ${escHtml(p.minAppVersion)} (app ${escHtml(CFG.appVersion)})</span>
      <div style="display:flex;gap:6px">${installBtn}${uninstallBtn}</div>`;
  } else if (!isInstalled) {
    cardClass  = 'card';
    footerHtml = `${howtoHtml}
      <span></span>
      <button class="btn ${btnClass}" data-plugin-id="${escHtml(p.id)}">${btnLabel}</button>`;
  } else if (hasUpdate) {
    cardClass  = 'card has-update';
    footerHtml = `${howtoHtml}
      <span class="badge-update">↑ v${escHtml(installedVer)} → v${escHtml(p.version)}</span>
      <div style="display:flex;gap:6px">
        <button class="btn ${btnClass}" data-plugin-id="${escHtml(p.id)}">${btnLabel}</button>
        <button class="btn btn-uninstall" data-plugin-id="${escHtml(p.id)}">✕</button>
      </div>`;
  } else {
    cardClass  = 'card is-installed';
    footerHtml = `${howtoHtml}
      <span class="badge-ok">✓ v${escHtml(installedVer)}</span>
      <div style="display:flex;gap:6px">
        <button class="btn btn-reinstall" data-plugin-id="${escHtml(p.id)}">↺</button>
        <button class="btn btn-uninstall" data-plugin-id="${escHtml(p.id)}">✕</button>
      </div>`;
  }

  return `
    <div class="${cardClass}" id="card-${p.id}">
      <div class="card-top">
        <div class="card-name">${escHtml(p.name)}</div>
        <div class="card-version">v${escHtml(p.version)}</div>
      </div>
      <div class="card-author">por ${escHtml(p.author || '—')}</div>
      <div class="card-desc">${escHtml(p.description || '')}</div>
      ${p.changelog ? `<div class="card-changelog">${escHtml(p.changelog)}</div>` : ''}
      ${tagsHtml ? `<div class="card-tags">${tagsHtml}</div>` : ''}
      <div class="card-footer">${footerHtml}</div>
    </div>`;
}

// ── HELPER: httpGet (reusable) ──────────────────────────────────
// Nota: esta função é definida dentro dos callbacks backend,
// mas precisamos dela em múltiplos lugares. Vamos manter inline.

// ── SEGURANÇA / CONFIRMAÇÃO ──────────────────────────────────────
const ALLOWED_HOSTS = [
  'raw.githubusercontent.com',
  'github.com',
  'codeload.github.com',
  'objects.githubusercontent.com',
];

function assertAllowedUrl(url) {
  let u;
  try { u = new URL(String(url)); }
  catch { throw new Error('URL inválida: ' + url); }
  if (u.protocol !== 'https:') throw new Error('URL não-HTTPS bloqueada: ' + url);
  if (!ALLOWED_HOSTS.includes(u.hostname)) throw new Error('Host não permitido: ' + u.hostname);
  return url;
}

function installWarningHtml(p) {
  const kind = p.manifestUrl ? 'manifesto (várias notas)'
    : p.sourceUrl ? 'código-fonte (1 nota)'
    : 'ZIP (importação manual)';
  const url = p.manifestUrl || p.sourceUrl || p.zipUrl || '';
  let host = url;
  try { host = new URL(url).hostname; } catch {}
  return `
    <div class="pm-modal-title">Instalar ${escHtml(p.name)} v${escHtml(p.version)}?</div>
    <div class="pm-modal-body">
      <div class="kv"><b>Autor</b><span>${escHtml(p.author || '—')}</span></div>
      <div class="kv"><b>Tipo</b><span>${escHtml(kind)}</span></div>
      <div class="kv"><b>Origem</b><span>${escHtml(host)}</span></div>
      <div class="pm-modal-warn">
        Este conteúdo roda com acesso total à API do Trilium — pode ler e alterar
        notas e arquivos e acessar a rede. Instale apenas de fontes em que você confia.
      </div>
    </div>
    <div class="pm-modal-actions">
      <button class="btn btn-cancel">Cancelar</button>
      <button class="btn btn-install">Instalar</button>
    </div>`;
}

function confirmInstall(p) {
  return new Promise((resolve) => {
    const $modal = $root.find('#pm-modal');
    $modal.html(`<div class="pm-modal-box">${installWarningHtml(p)}</div>`).css('display', 'flex');
    const close = (result) => { $modal.hide().empty(); resolve(result); };
    $modal.find('.btn-cancel').one('click', () => close(false));
    $modal.find('.btn-install').one('click', () => close(true));
  });
}

// ── INSTALL ──────────────────────────────────────────────────────
async function installPlugin(p, btn) {
  if (!btn) btn = $root.find(`[data-plugin-id="${p.id}"]`).first();

  const confirmed = await confirmInstall(p);
  if (!confirmed) return;

  if (btn.length) { btn.prop('disabled', true); btn.html('<span class="spinner"></span>Instalando...'); }

  try {
    if (p.manifestUrl) {
      assertAllowedUrl(p.manifestUrl);
      // ── Fluxo manifestUrl: baixa manifest + cria múltiplas notas ──
      btn.html('<span class="spinner"></span>Instalando...');
      const result = await api.runAsyncOnBackendWithManualTransactionHandling(
        async (manifestUrl, parentNoteId, pluginId, pluginVersion, pluginName) => {
          function assertAllowedUrl(url) {
            const u = new URL(url);
            if (u.protocol !== 'https:') throw new Error('URL não-HTTPS bloqueada: ' + url);
            if (!['raw.githubusercontent.com', 'github.com', 'codeload.github.com', 'objects.githubusercontent.com'].includes(u.hostname)) {
              throw new Error('Host não permitido: ' + u.hostname);
            }
          }

          function httpGet(url, depth) {
            // fetch é o caminho permitido no sandbox de scripts (0.105+ bloqueia require('https'))
            if ((depth || 0) > 5) return Promise.reject(new Error('Muitos redirects'));
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 30000);
            return fetch(url, { redirect: 'follow', signal: controller.signal })
              .then((res) => {
                if (res.status >= 400) throw new Error(`HTTP ${res.status}`);
                return res.text();
              })
              .catch((e) => {
                if (e && e.name === 'AbortError') throw new Error('Timeout (30s)');
                throw e;
              })
              .finally(() => clearTimeout(timer));
          }

          // 1. Baixa o manifest
          assertAllowedUrl(manifestUrl);
          const manifestRaw = await httpGet(manifestUrl);
          let manifest;
          try { manifest = JSON.parse(manifestRaw.toString('utf-8')); }
          catch (e) { throw new Error('Manifest inválido: ' + e.message); }

          if (!manifest.notes || !manifest.notes.length) throw new Error('Manifest sem notas');

          const baseUrl = manifestUrl.substring(0, manifestUrl.lastIndexOf('/') + 1);
          const noteMap = {};

          // 2. Cria cada nota do manifest — suporta hierarquia via 'children'
          //    (nota mãe render com filhas: código, config, etc.)
          async function createNoteDef(parentId, def) {
            let content = def.content || '';
            if (def.sourceUrl) {
              const srcUrl = def.sourceUrl.match(/^https?:\/\//) ? def.sourceUrl : baseUrl + def.sourceUrl;
              assertAllowedUrl(srcUrl);
              const srcBuf = await httpGet(srcUrl);
              content = srcBuf.toString('utf-8');
            }
            const created = await api.createNewNote({
              parentNoteId: parentId,
              title: def.title,
              content,
              type: def.type || 'text',
              mime: def.mime || undefined
            });
            const nid = created.note.noteId;
            noteMap[def.title] = nid;
            if (Array.isArray(def.children)) {
              for (const childDef of def.children) {
                await createNoteDef(nid, childDef);
              }
            }
            return nid;
          }
          for (const def of manifest.notes) {
            await createNoteDef(parentNoteId, def);
          }

          // 3. Aplica labels do manifest
          if (manifest.labels) {
            for (const lbl of manifest.labels) {
              const noteId = noteMap[lbl.note];
              if (!noteId) continue;
              const note = api.getNote(noteId);
              if (note) {
                await note.setAttribute('label', lbl.name, lbl.value || '');
              }
            }
          }

          // 4. Cria relations do manifest
          if (manifest.relations) {
            for (const rel of manifest.relations) {
              const fromId = noteMap[rel.from];
              const toId = noteMap[rel.to];
              if (fromId && toId) {
                const fromNote = api.getNote(fromId);
                if (fromNote) {
                  fromNote.setRelation(rel.type, toId);
                }
              }
            }
          }

          // 5. Marca a primeira nota com os metadados do plugin
          const firstTitle = manifest.notes[0].title;
          const firstNote = api.getNote(noteMap[firstTitle]);
          if (firstNote) {
            await firstNote.setAttribute('label', 'pluginId',      pluginId);
            await firstNote.setAttribute('label', 'pluginVersion', pluginVersion);
            await firstNote.setAttribute('label', 'pluginName',    pluginName);
          }

          return { noteId: noteMap[firstTitle] };
        },
        [p.manifestUrl, CFG.installedNoteId, p.id, p.version, p.name]
      );

      installedMap.set(p.id, p.version);
      showToast(`✓ ${p.name} v${p.version} instalado!`, 'ok');

    } else if (p.sourceUrl) {
      assertAllowedUrl(p.sourceUrl);
      // ── Fluxo sourceUrl: baixa o .js/.jsx e cria nota code diretamente ──
      btn.html('<span class="spinner"></span>Baixando...');
      const result = await api.runAsyncOnBackendWithManualTransactionHandling(
        async (sourceUrl, parentNoteId, pluginId, pluginVersion, pluginName, labels) => {
          function assertAllowedUrl(url) {
            const u = new URL(url);
            if (u.protocol !== 'https:') throw new Error('URL não-HTTPS bloqueada: ' + url);
            if (!['raw.githubusercontent.com', 'github.com', 'codeload.github.com', 'objects.githubusercontent.com'].includes(u.hostname)) {
              throw new Error('Host não permitido: ' + u.hostname);
            }
          }

          function httpGet(url, depth) {
            // fetch é o caminho permitido no sandbox de scripts (0.105+ bloqueia require('https'))
            if ((depth || 0) > 5) return Promise.reject(new Error('Muitos redirects'));
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 30000);
            return fetch(url, { redirect: 'follow', signal: controller.signal })
              .then((res) => {
                if (res.status >= 400) throw new Error(`HTTP ${res.status}`);
                return res.text();
              })
              .catch((e) => {
                if (e && e.name === 'AbortError') throw new Error('Timeout (30s)');
                throw e;
              })
              .finally(() => clearTimeout(timer));
          }
          assertAllowedUrl(sourceUrl);
          const buf = await httpGet(sourceUrl);
          if (!buf.length) throw new Error('Source vazio: ' + sourceUrl);
          const source = buf.toString('utf-8');

          const created = await api.createNewNote({
            parentNoteId,
            title: pluginName,
            content: source,
            type: 'code',
            mime: 'application/javascript;env=frontend'
          });
          const note = created.note;
          await note.setAttribute('label', 'pluginId',      pluginId);
          await note.setAttribute('label', 'pluginVersion', pluginVersion);
          await note.setAttribute('label', 'pluginName',    pluginName);
          if (Array.isArray(labels)) {
            for (const l of labels) {
              if (l && l.name) await note.setAttribute('label', l.name, l.value || '');
            }
          }
          return { noteId: note.noteId };
        },
        [p.sourceUrl, CFG.installedNoteId, p.id, p.version, p.name, p.labels || null]
      );

      installedMap.set(p.id, p.version);
      showToast(`✓ ${p.name} v${p.version} instalado!`, 'ok');

    } else if (p.zipUrl) {
      assertAllowedUrl(p.zipUrl);
      // ── Fluxo zipUrl: download do ZIP para o usuário instalar manualmente ──
      const a = document.createElement('a');
      a.href = p.zipUrl;
      a.download = (p.name || 'script') + '.zip';
      a.target = '_blank';
      a.rel = 'noopener';
      a.click();
      showToast(`📥 ${p.name} — ZIP baixado. Importe manualmente em Options > Import`, 'ok');
      if (btn.length) { btn.prop('disabled', false); btn.text('Baixar'); }
      return;

    } else {
      throw new Error('Script/Widget sem manifestUrl, sourceUrl ou zipUrl');
    }

    applyView();

  } catch (err) {
    showToast(`✗ ${p.name}: ${err.message || err || 'Erro desconhecido'}`, 'error');
    if (btn.length) { btn.prop('disabled', false); btn.text('Instalar'); }
    console.error('[PluginManager] install error:', err);
  }
}

// ── UNINSTALL ────────────────────────────────────────────────────
async function uninstallPlugin(p, btn) {
  if (!btn) btn = $root.find(`[data-plugin-id="${p.id}"]`).first();
  if (btn.length) { btn.prop('disabled', true); btn.html('<span class="spinner"></span>'); }

  try {
    await api.runAsyncOnBackendWithManualTransactionHandling(async (installedNoteId, pluginId) => {
      try {
        const installedNote   = await api.getNote(installedNoteId);
        const children = await installedNote.getChildNotes();
        const target   = children.find(n => n.getAttribute('label', 'pluginId')?.value === pluginId);
        if (!target) throw new Error(`Nota do script/widget "${pluginId}" não encontrada em Installed.`);
        await target.delete();
      } catch (err) {
        console.error('[PluginManager] backend uninstall err:', err);
        throw new Error(String(err?.message || err || 'Erro desconhecido no backend'));
      }
    }, [CFG.installedNoteId, p.id]);

    installedMap.delete(p.id);
    showToast(`🗑 ${p.name} removido.`, 'ok');

    applyView();

  } catch (err) {
    showToast(`✗ ${err.message || err || 'Erro desconhecido'}`, 'error');
    if (btn.length) { btn.prop('disabled', false); btn.text('✕'); }
    console.error('[PluginManager] uninstall error:', err);
  }
}

// ── UTILS ────────────────────────────────────────────────────────
function semverParse(v) {
  const m = String(v || '0').trim().match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:[-+](.*))?$/);
  return m
    ? { major: +m[1], minor: +(m[2] || 0), patch: +(m[3] || 0), pre: m[4] || null }
    : { major: 0, minor: 0, patch: 0, pre: null };
}

function semverGt(a, b) {
  const x = semverParse(a), y = semverParse(b);
  if (x.major !== y.major) return x.major > y.major;
  if (x.minor !== y.minor) return x.minor > y.minor;
  if (x.patch !== y.patch) return x.patch > y.patch;
  if (x.pre === y.pre) return false;
  if (x.pre === null) return true;
  if (y.pre === null) return false;
  return x.pre > y.pre;
}

function isSemver(v) {
  return typeof v === 'string' && /^\d+\.\d+\.\d+(?:[-+].+)?$/.test(v.trim());
}

function isIncompatible(p) {
  if (!p || !p.minAppVersion || !CFG.appVersion) return false;
  return semverGt(p.minAppVersion, CFG.appVersion);
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

    const urls = ['sourceUrl', 'manifestUrl', 'zipUrl'].filter(k => p[k]);
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

function renderInvalidNotice(invalid) {
  const panel = $root.find('#invalid-panel');
  if (!invalid || !invalid.length) { panel.hide().empty(); return; }
  const items = invalid.map(it =>
    `<li><code>${escHtml(it.id)}</code> — ${it.errors.map(escHtml).join('; ')}</li>`
  ).join('');
  panel.html(
    `<strong>⚠ ${invalid.length} entrada(s) do registry foram ignoradas</strong> (schema inválido):<ul>${items}</ul>`
  ).show();
}

function setBanner(msg, type) {
  const el = $root.find('#banner');
  el.attr('class', 'banner ' + (type || ''));
  el.html('<div class="dot"></div><span>' + escHtml(msg) + '</span>');
}

function setContent(html) {
  $root.find('#content').html(html);
}

function escHtml(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function showToast(msg, type) {
  const t = Object.assign(document.createElement('div'), {
    className: 'toast ' + type,
    textContent: msg
  });
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 4000);
}

// ── EVENT DELEGATION ─────────────────────────────────────────────
$root.find('.btn-refresh').on('click', init);

$root.on('click', '.btn-install, .btn-update, .btn-reinstall, .btn-download', function(e) {
  const $btn = $(this);
  const p = pluginsMap[$btn.data('plugin-id')];
  if (p) installPlugin(p, $btn);
});

$root.on('click', '.btn-uninstall', function(e) {
  const $btn = $(this);
  const p = pluginsMap[$btn.data('plugin-id')];
  if (p) uninstallPlugin(p, $btn);
});

$root.on('click', '.btn-howto', function(e) {
  e.preventDefault();
  const p = pluginsMap[$(this).data('plugin-id')];
  if (p && p.homepage) window.open(p.homepage, '_blank', 'noopener');
});

$root.on('click', '.cat-pill', function(e) {
  activeCategory = $(this).data('cat');
  renderCategoryBar();
  applyView();
});

$root.on('input', '#pm-search', function() {
  searchQuery = String($(this).val() || '');
  applyView();
});

$root.on('change', '#pm-sort', function() {
  sortMode = String($(this).val() || 'registry');
  applyView();
});

// ── START ─────────────────────────────────────────────────────────
init();
