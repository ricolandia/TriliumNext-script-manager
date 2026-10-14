# BENCHMARK — Obsidian (referência) × TriliumNext Plugin Manager

> Sessão de execução do Trilium Plugin Manager · Passo 1 (T2).
> Método: **Plano B — sem REA**. O Obsidian é fechado, mas é Electron e o ecossistema
> que interessa é aberto: li a **API documentada**, o **help do usuário**, o
> **registry comunitário** e o **código-fonte/manifests de plugins reais**.
> Nenhum `asar` foi extraído; nenhuma engenharia reversa foi feita.

## Como ler este documento

Cada eixo tem: **o que o Obsidian faz · o que temos hoje · lacuna · evidência ·
esforço · prioridade · licença**. O padrão de evidência é **arquivo:linha** quando a
referência é código; quando é documentação publicada (Obsidian Publish), cito
**página + seção** (linha é instável em doc publicado). Confiança é indicada por eixo.
O que **não** foi verificado está listado no fim.

## Fontes primárias consultadas (2026-10-14)

- Docs do desenvolvedor: `docs.obsidian.md` (vault `caa27d6312fe5c26ebc657cc609543be`)
  — páginas `Reference/Manifest`, `Plugins/User interface/Settings`,
  `Plugins/Guides/Manage plugin lifecycle`, `Plugins/Guides/Defer views`,
  `Plugins/Guides/Optimize plugin load time`, `Plugins/Guides/Store secrets`,
  `Community directory/Developer policies`, `Community directory/Submission requirements for plugins`.
- Help do usuário: `obsidian.md/help` — `Extending Obsidian/Community plugins`,
  `Extending Obsidian/Community directory`, `Extending Obsidian/Plugin security`.
- Registry: `github.com/obsidianmd/obsidian-releases` (`community-plugins.json`,
  `community-plugin-stats.json`, `community-plugins-removed.json`,
  `community-plugin-deprecation.json`, `plugin-review.md`, README).
- Manifests reais: `obsidianmd/obsidian-sample-plugin`, `blacksmithgu/obsidian-dataview`,
  `SilentVoid13/Templater`, `Vinzent03/obsidian-git`, `pjeby/hot-reload`,
  `TfTHacker/obsidian42-brat`, `liamcain/obsidian-periodic-notes`, `mgmeyers/obsidian-style-settings`.
- Código do nosso lado: `trilium-plugin-manager-v4.js`, `registry.json`,
  `README.md`, `CONTEXTO.md`, `MANIFEST_GENERATOR.md`.

## Mapa de licenças (regra 2 do briefing)

| Referência | Licença | O que é permitido portar |
|---|---|---|
| App Obsidian (Electron) | Proprietária / fechada | Nada de código. Só **comportamento observável** e ideias. |
| Docs `docs.obsidian.md` / help | Obra de documentação (Dynalist Inc.), sem licença aberta declarada | Ler e resumir; **não** copiar texto/artes. |
| `obsidian-releases` (registry) | **Sem arquivo LICENSE** (all rights reserved) | Usar como *referência de estrutura* (fatos). Não redistribuir o JSON. |
| `obsidian-api` / `obsidian-sample-plugin` | Permissiva estilo 0BSD (Dynalist Inc.) | Padrões de API; nada de UI/arte. |
| Dataview, obsidian-git, BRAT, Periodic Notes | **MIT** | Poderia portar código com atribuição — mas a regra é **portar ideia, não código**. |
| Style Settings | **GPL-3.0** | ⚠️ Copyleft: **proibido** copiar código para um projeto MIT. Só ideias. |
| Hot Reload | Permissiva (ISC-like) | Só ideias. |
| Templater | **Sem LICENSE no repo** | Só ideias; tratar como all rights reserved. |

**Regra transversal:** copiar UI, ícones ou arte é proibido em qualquer caso (regra 3).

---

## Resumo executivo (ordenado por esforço × ganho)

| # | Lacuna | Eixo | Esforço | Ganho | Prioridade |
|---|---|---|---|---|---|
| G1 | Registry sem validação de schema; manifesto sem validação de campos obrigatórios | 8/10 | Baixo | Alto | **P1** |
| G2 | Sem busca textual, sem ordenação, categorias por tags *hardcoded* e com colisão | 1 | Baixo/Médio | Alto | **P1** |
| G3 | Sem declaração de compatibilidade (`minAppVersion`/`versions.json`) nem changelog | 4/3 | Baixo | Médio | **P1** |
| G4 | Instalação de conteúdo remoto sem verificação (hash/assinatura) nem aviso de risco | 6 | Médio | Alto | P2 |
| G5 | Sem UI de settings por plugin (config vive em labels soltas) | 7 | Alto | Médio | P2 |
| G6 | Sem fluxo de publicação/revisão (registry pessoal, sem pipeline) | 9 | Alto | Médio | P3 |
| G7 | Sem versionamento do formato do registry nem estatísticas/popularidade | 10 | Médio | Baixo/Médio | P3 |
| G8 | Sem rollback de versão | 3 | Alto | Baixo | P4 |

*(Tabela é insumo do Passo 2 — a decisão final de o que implementar vem depois.)*

---

## Eixo 1 — Descoberta / busca

**O que o Obsidian faz.** O app tem um painel **Browse** com uma caixa de texto que
filtra por **nome, autor e descrição** (`Community plugins` §"Browse community
plugins"). Fora do app, o diretório `community.obsidian.md` lista cada plugin com
**categorias**, descrição longa, screenshots, **total de downloads**, plataformas
suportadas, licença e um "scorecard" (`Community directory` §Header/Overview/Sidebar).
Popularidade existe como dado real: `community-plugin-stats.json` traz
`downloads` e `updated` (epoch ms) por plugin e por versão. O registry legado
`community-plugins.json` tem **8.942 plugins** (medido 2026-10-14) com os campos
`id, name, author, description, repo` — e o README confirma que **`name`, `author`
e `description` são os campos usados para busca**.

**O que temos hoje.** 5 categorias fixas (`CATEGORIES`, `trilium-plugin-manager-v4.js:399-406`)
com correspondência **tag→categoria hardcoded**; `getPluginCategory()` devolve a
**primeira** categoria que casar (`:548-555`); barra de pílulas com contagem
(`renderCategoryBar`, `:557-571`); grade de cards (`:578-645`). **Não existe** busca
textual, ordenação, favoritos, "recentes" ou popularidade.

**Lacuna.** Falta (a) busca por nome/autor/descrição, (b) ordenação (nome,
recentes, instalados), (c) um filtro por tag livre em vez de 5 baldes. A colisão de
categorias é real: `"productivity"` está em `ui` e o `weekly-planner` (tags
`productivity, planning, kanban`) cai em `ui`, embora seja de escrita/planejamento.

**Evidência.** `trilium-plugin-manager-v4.js:399-406, 548-571, 578-645`;
docs Obsidian `Plugins/User interface` (Browse), help `Community directory`;
`obsidian-releases/community-plugins.json` (campos + contagem),
`community-plugin-stats.json` (downloads).

**Esforço.** Baixo/Médio (busca + ordenação são ~40 linhas de jQuery puro).
**Prioridade.** P1. **Licença.** Ideia/estrutura, sem código — livre.

---

## Eixo 2 — Instalação

**O que o Obsidian faz.** Três caminhos: (1) **Browse → Install**, que baixa
`manifest.json`, `main.js` e `styles.css` do **GitHub release cuja tag == versão do
manifest** e os coloca na pasta do vault (`obsidian-releases` README §"How community
plugins are pulled"); (2) **beta/teste** via plugin de terceiros **BRAT**, que
instala de repositório/branch arbitrário (`Plugins/Releasing/Beta-testing plugins`);
(3) **manual**: copiar a pasta para `.obsidian/plugins` (`Build a plugin` §Step 1).
Instalar ≠ usar: é preciso **habilitar** depois (`Community plugins` §Install/Enable).

**O que temos hoje.** Três fluxos em `installPlugin()` (`:652-845`):
`manifestUrl` (baixa manifesto, cria árvore de notas com `children`, aplica
`labels`/`relations`, marca `pluginId/pluginVersion/pluginName` — `:657-760`),
`sourceUrl` (baixa `.js`/`.jsx` e cria 1 nota code — `:762-809`) e `zipUrl`
(download manual do ZIP — `:811-821`). `httpGet` é `fetch` com timeout de 30s e
abort (`:662-677`, `:767-782`).

**Lacuna.** (a) Não há **validação do que se instala** (só `status>=400`); (b) não
há confirmação/aviso antes de criar notas de código que rodarão com acesso total à
API; (c) não há "instalar de URL arbitrária" como o BRAT (só o que está no registry).

**Evidência.** `trilium-plugin-manager-v4.js:652-845`;
`obsidian-releases/README.md` §"How community plugins are pulled";
`Plugins/Releasing/Beta-testing plugins.md`.
**Esforço.** Médio (validação) / Baixo (aviso). **Prioridade.** P2.
**Licença.** BRAT é MIT (ideias ok).

---

## Eixo 3 — Atualização

**O que o Obsidian faz.** **Não há auto-update**: "For security purposes, community
plugins don't update automatically" (`Community plugins` §Update plugins). O usuário
vai em **Community plugins → Current plugins → Check for updates** e escolhe
**Update all** ou **Update** por plugin. Quando o app está aberto, ele puxa o
`manifest.json` do repo só para descobrir a versão mais nova; os arquivos vêm do
release. **Não existe rollback** na UI.

**O que temos hoje.** Detecção **no carregamento**: `updateCount` compara
`p.version` com o label `#pluginVersion` instalado (`:493-495`), usando `semverGt`
(`:888-895`); card amarelo `has-update` com `↑ vX → vY` (`:596, 616-623`). O botão
de atualizar reusa `installPlugin` (mesmo fluxo de instalação). "Atualizar" o painel
é `init()` (`:921`). Reinstalar existe (`↺`, `:629`).

**Lacuna.** (a) Não há checagem "check for updates" **sob demanda com feedback**
(há, mas reusa o refresh); (b) **sem rollback**; (c) sem histórico/changelog por
versão; (d) a comparação assume semver simples de 3 números — pré-release
(`1.0.0-beta`) não é tratado.

**Evidência.** help `Community plugins` §Update plugins;
`trilium-plugin-manager-v4.js:493-495, 596, 616-623, 888-895`.
**Esforço.** Baixo (changelog/semver pré-release) / Alto (rollback).
**Prioridade.** P1 (changelog/semver), P4 (rollback). **Licença.** Ideia, livre.

---

## Eixo 4 — Versionamento

**O que o Obsidian faz.** `version` é **semver `x.y.z` obrigatório**
(`Reference/Manifest`). Existe **`minAppVersion`** obrigatório (versão mínima do
app) e **`versions.json`** que mapeia *versão-do-plugin → versão-mínima-do-app*;
se o manifest exigir app mais novo que o instalado, o app **consulta o `versions.json`
e instala a última versão compatível** (`obsidian-releases` README). Exemplos reais:
Templater `versions.json` cai de `"2.26.0":"1.13.0"` até `"2.18.1":"1.5.0"`;
obsidian-git lista `"2.40.0":"1.12.0"`, `"2.41.0":"1.13.0"`. `isDesktopOnly`
declara se usa Node/Electron (só desktop).

**O que temos hoje.** `registry.json` tem `version` (semver) e nada mais.
`semverGt` (`:888-895`) faz só major/minor/patch. **Não há** `minAppVersion`,
compatibilidade com a versão do TriliumNext, nem `versions.json`. O manifesto
(`CONTEXTO.md` §5, `MANIFEST_GENERATOR.md`) não declara versão.

**Lacuna.** Declarar e **respeitar** compatibilidade: um campo de versão mínima do
TriliumNext e, idealmente, um mapa de compatibilidade. Sem isso, instalar num
Trilium antigo quebra silenciosamente.

**Evidência.** `Reference/Manifest.md`; `obsidian-releases/README.md`;
`Templater/versions.json`, `obsidian-git/versions.json`, `versions.json` do sample
(`{"1.0.0":"1.0.0"}`); `trilium-plugin-manager-v4.js:888-895`.
**Esforço.** Baixo (campo + checagem). **Prioridade.** P1.
**Licença.** Estrutura de dados/fato — livre.

---

## Eixo 5 — Ciclo de vida

**O que o Obsidian faz.** O `Plugin` estende `Component`; `onload()` configura,
`onunload()` libera (`Anatomy of a plugin`). Há um **sistema de recursos com limpeza
automática** (`registerEvent`, `registerInterval`, `registerDomEvent`,
`Manage plugin lifecycle`) e hierarquia de `Component`s (filho morre com o pai).
**Views são "deferidas"** desde 1.7.2 (`Defer views`): só carregam quando visíveis,
com `loadIfDeferred()` explícito. `onload` deve ser leve; trabalho de inicialização
vai em `onLayoutReady` (`Optimize plugin load time`). **Hot reload** não é nativo —
é o plugin de terceiros **Hot Reload** (`Development workflow`).

**O que temos hoje.** Instalar cria a nota; habilitar é implícito (widgets ganham
`#widget` via `labels`, `:798-802`). Desinstalar apaga a nota
(`uninstallPlugin`, `:848-885`). **Não há** enable/disable sem desinstalar, nem
carregamento sob demanda, nem hot reload — o "reload" (`↻`, `:921`) só re-renderiza
o painel. As notas de código do TriliumNext rodam no render do app, sem ciclo de
vida declarado.

**Lacuna.** (a) Habilitar/desabilitar sem apagar (toggle de label); (b) registrar
metadados de recurso para limpeza; (c) documentar que "reload do painel" ≠ reload do
plugin.

**Evidência.** `Plugins/Getting started/Anatomy of a plugin.md`,
`Plugins/Guides/Manage plugin lifecycle.md`, `Plugins/Guides/Defer views.md`,
`Plugins/Guides/Optimize plugin load time.md`, `Plugins/Releasing/Plugin guidelines.md`
(§"Clean up resources when plugin unloads");
`trilium-plugin-manager-v4.js:798-802, 848-885, 921`.
**Esforço.** Médio. **Prioridade.** P2. **Licença.** Ideia, livre.

---

## Eixo 6 — Isolamento e segurança

**O que o Obsidian faz.** Modelo explícito e **honesto sobre o limite**: "Obsidian
cannot reliably restrict plugins to specific permissions"; plugins **herdam** o
acesso do app e podem ler arquivos, acessar a internet e instalar programas
(help `Plugin security` §Plugin capabilities). Mitigações: **Restricted Mode**
(ligado por padrão, bloqueia execução de terceiros) com aviso de que plugins rodam
código de terceiros; **scan automático** de cada versão (vulnerabilidades, qualidade,
malware) exibido como **safety scorecard** no diretório; revisão manual para
populares/destacados; política de *disclosures* obrigatórios no README (rede,
arquivos fora do vault, pagamento, telemetria server-side) e proibições
(**sem obfuscação, sem telemetria client-side, sem auto-instalação/auto-update**)
(`Developer policies`). `SecretStorage`/`SecretComponent` centralizam segredos fora
do `data.json` (`Store secrets`). `isDesktopOnly` limita Node/Electron ao desktop
(`Submission requirements`).

**O que temos hoje.** Baixo: `httpGet` só checa `status>=400` e timeout
(`:662-677`); o fonte baixado é gravado direto como nota de código
`application/javascript;env=frontend` (`:787-793`) e **roda com acesso à API**;
sem hash, sem assinatura, sem aviso de risco ao usuário, sem allowlist de domínio.
`escHtml` (`:907-909`) protege só a renderização do card, não a instalação.
O token ETAPI é lido de label em nota (`:422`) e não há cofre de segredos.

**Lacuna.** (a) Aviso explícito ao instalar código de terceiros; (b) verificação de
integridade (hash do artefato no registry); (c) allowlist de hosts (ex. só
`raw.githubusercontent.com`); (d) revisão/scorecard mínimo no registry; (e) armazenar
segredos fora de labels.

**Evidência.** help `Plugin security`; `Community directory/Developer policies.md`
(§Not allowed / Disclosures); `Community directory/Submission requirements for plugins.md`;
`Plugins/Guides/Store secrets.md`; help `Community directory` §Scorecard;
`trilium-plugin-manager-v4.js:422, 662-677, 787-793, 907-909`.
**Esforço.** Médio. **Prioridade.** P2 (aviso+allowlist) — o de maior impacto ético.
**Licença.** Políticas/ideias, livres.

---

## Eixo 7 — Settings por plugin

**O que o Obsidian faz.** UI padrão via `PluginSettingTab` + `addSettingTab()`
(`Plugins/User interface/Settings`). Desde 1.13.0 há **API declarativa**
(`getSettingDefinitions()`): o app lê/escreve a chave e chama `saveData()`
automaticamente. Persistência em `loadData()`/`saveData()` (arquivo `data.json`),
com defaults por `Object.assign({}, DEFAULT_SETTINGS, await this.loadData())`.
Segredos via `SecretStorage` (não no `data.json`). Há ainda
`onExternalSettingsChange` para quando o `data.json` é alterado por fora (sync).
Migração de settings é responsabilidade do plugin (`Migrate to declarative settings`).

**O que temos hoje.** **Não existe** UI de settings por plugin. Config vive em
**labels soltas** nas notas (ex. `#pluginRegistry` com `#registryUrl`, `#etapiToken`,
`#triliumPort` — `:381-391, 422-424`) e no manifesto via `labels[]`/config note
(`MANIFEST_GENERATOR.md` Note 4). O usuário edita atributos na barra lateral do Trilium.

**Lacuna.** Um painel de configuração por plugin instalado (persistência + defaults
+ migração), mesmo que simplificado. Hoje cada plugin reinventa o padrão de config.

**Evidência.** `Plugins/User interface/Settings.md` (declarativo 1.13+ e legado
`display()`), `Plugins/Guides/Store secrets.md`,
`Reference/TypeScript API/Plugin/loadData|saveData|onExternalSettingsChange`;
`trilium-plugin-manager-v4.js:381-391, 422-424`.
**Esforço.** Alto. **Prioridade.** P2. **Licença.** Ideia, livre.

---

## Eixo 8 — Manifesto do plugin

**O que o Obsidian faz.** `manifest.json` com schema fixo e **campos obrigatórios**:
`id`, `name`, `version`, `minAppVersion`, `description`, `author`, `isDesktopOnly`
(+ opcionais `authorUrl`, `fundingUrl`, `helpUrl`). Regras de `id`: só minúsculas e
hífens, não termina em `plugin`, não contém `obsidian` (`Reference/Manifest`). O
manifest é processado do **HEAD do branch default**; a tag do release deve casar
com `version`. O `id` local deve casar com o nome da pasta (senão
`onExternalSettingsChange` não é chamado).

**O que temos hoje.** Nosso "manifesto" é o **manifest de instalação** (lista de
notas a criar), não um manifesto de identidade: `notes[]` (com `children`
recursivo), `relations[]`, `labels[]` (`CONTEXTO.md` §5; `README.md` §"Multi-note").
**Não há** `id`, versão, autor, `minAppVersion` **dentro do manifest** — a
identidade vive no `registry.json`; os labels/relations referenciam notas **por
título** (`:707, 722-742`), o que quebra se títulos repetirem ou mudarem. Não há
validação de schema (`MANIFEST_GENERATOR.md` é um prompt de IA + checklist manual).

**Lacuna.** (a) Manifesto de identidade com `id`/`version`/`author`/compatibilidade;
(b) validação de campos obrigatórios e de referências (labels/relations por título →
ou por id estável); (c) geração determinística (o `MANIFEST_GENERATOR.md` hoje
depende de IA + checklist).

**Evidência.** `Reference/Manifest.md`; `obsidian-releases/README.md` (tag==version);
`CONTEXTO.md` §5; `MANIFEST_GENERATOR.md`; `trilium-plugin-manager-v4.js:707, 722-742`.
**Esforço.** Baixo. **Prioridade.** **P1**. **Licença.** Schema/fato, livre.

---

## Eixo 9 — Publicação / revisão

**O que o Obsidian faz.** Antes: PR em `obsidian-releases` adicionando uma linha ao
`community-plugins.json`. Hoje: submissão via **`community.obsidian.md`** com conta
Obsidian + GitHub linkado; a **primeira** versão é submetida, depois **cada release
novo basta** (sem re-submissão). A revisão é **automática** e agrupada em
**Manifest, Releases, Source code, Build verification**, com resultados
**Error/Warning/Recommendation/Pass** (`Manage your plugin or theme`). O scanner
roda o script de build (`build`→`build:plugin`→`compile`) e **verifica se o build
bate com o commitado**. Requisitos: `README.md`, `LICENSE`, descrição ≤250 chars
terminando em ponto, `minAppVersion` adequado, `isDesktopOnly` correto, sem código
de sample. Políticas: sem obfuscação/telemetria client-side/auto-update; disclosures
obrigatórios; forks com regras; remoção por violação/abandono (`Developer policies`).
Descontinuados saem para `community-plugins-removed.json` / `community-plugin-deprecation.json`.

**O que temos hoje.** Nenhum fluxo: o registry é um **JSON pessoal** num repo, editado
à mão, sem revisão, sem PR, sem pipeline, sem verificação de build. `plugin-review.md`
do Obsidian aponta para `Plugin guidelines` (checklist de revisão). Não há "lista de
removidos" nem depreciação.

**Lacuna.** (a) Checklist de submissão mínimo; (b) validação automática do registry
(CI simples: JSON válido, URLs resolvem, `raw.githubusercontent.com`, sem `blob`);
(c) lista de depreciação/remoção.

**Evidência.** `Community directory/Submit your plugin.md`,
`Community directory/Manage your plugin or theme.md`,
`Community directory/Submission requirements for plugins.md`,
`Community directory/Developer policies.md`, `obsidian-releases/README.md`,
`obsidian-releases/plugin-review.md`, listas `*-removed/deprecation.json`.
**Esforço.** Alto (pipeline completo) / Baixo (checklist+CI). **Prioridade.** P3.
**Licença.** Políticas/documentação — ideias, livres.

---

## Eixo 10 — Registry

**O que o Obsidian faz.** `community-plugins.json` = **array** de
`{id, name, author, description, repo}` — **8.942 entradas** hoje, ~2,7 MB; campos
leves e delegando o resto ao GitHub. Dados auxiliares separados:
`community-plugin-stats.json` (`downloads`, `updated`, downloads por versão),
`community-css-themes.json`, `community-snippets.json`, `community-plugins-removed.json`,
`community-plugin-deprecation.json`, `desktop-releases.json`. O app **só lê o JSON
leve**; `manifest.json`/`README.md` vêm do repo sob demanda. O diretório novo
(`community.obsidian.md`) adiciona categorias, pagamentos, screenshots e scorecard —
mas a instalação continua vindo dos **GitHub releases**.

**O que temos hoje.** `registry.json` = `{ meta, plugins[] }` com 15 plugins
(`:1-265`); por plugin: `id, name, description, version, author, homepage, tags` e um
de `sourceUrl|manifestUrl|zipUrl`, opcionalmente `labels[]`. Há `meta.updated`.
**Não há** versão do formato, nem estatísticas, nem categorias (são derivadas de tags),
nem depreciação. O registry inteiro é carregado em memória e filtrado no cliente.

**Lacuna.** (a) `meta.schemaVersion` para evoluir o formato; (b) categorias como dado
(ex. campo `category`) em vez de mapa hardcoded; (c) campos de popularidade/última
atualização; (d) separar índice leve de metadados pesados (descrição longa,
screenshots) — hoje tudo num arquivo só, ok para 15, não escala.

**Evidência.** `obsidian-releases/community-plugins.json` (+ stats/removed/deprecation);
help `Community directory`; `trilium-plugin-manager-v4.js:399-406`;
`registry.json:1-265`.
**Esforço.** Médio. **Prioridade.** P3. **Licença.** Estrutura/fato, livre.

---

## Lacunas transversais / quick wins (do T1)

- **Lixo de sync**: `registry.sync-conflict-20260610-113601-JMUIXPV.json` ainda no repo.
- **Sem testes**: zero cobertura; o parse/validação do `registry.json` é o alvo mais óbvio de um primeiro smoke test.
- **Sem CI**: nada valida o registry a cada push (o Obsidian tem scanner; nós não temos nem JSON-lint no CI).
- **Sem `minAppVersion`** em nenhum plugin (eixo 4) — afeta todos os 15.
- **Sem busca** (eixo 1) — atrito direto de UX para 15 e para qualquer crescimento.

## O que NÃO foi verificado (lacunas de evidência)

- **UI interna do Obsidian** (telas de Browse/Installed, ordenação padrão, atalhos):
  o app é fechado; descrevi pelo help do usuário, **não** por observação direta.
  Ordenação por downloads *dentro do app* não foi confirmada — só no site do diretório.
- **Mecânica exata do "Check for updates"** (o que é cacheado, intervalo): não
  documentado; descrito pelo comportamento relatado no help.
- **Rollback**: assumi que **não** existe na UI; não achei doc que confirme a ausência.
- **Scan/scorecard**: vi a *descrição* dos critérios, não a implementação.
- **Licença de `Templater`**: não encontrei arquivo de licença no repo (tratado como
  all rights reserved).
- **`community.obsidian.md`**: descrevi pela doc; não fiz login nem inspecionei a API.
- **`asar`**: não extraído (Plano B); qualquer conclusão sobre código interno do app
  seria especulação.

## Confiança por eixo

Alta: 1, 2, 4, 8, 10 (docs + manifests verificados).
Média-alta: 3, 5, 6, 7, 9 (docs oficiais, mas sem observação direta do app).
