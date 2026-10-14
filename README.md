# 🧩 TriliumNext Script Manager (Scripts, Widgets & Render Notes)

A self-contained script manager that lives **inside** TriliumNext. Install, update, and remove scripts, widgets, and render notes with a single click — no external tools, no CLI, no wrappers.

> **Terminology note:** TriliumNext uses the official Trilium terms *scripts*, *custom widgets*, *launch bar widgets*, *render notes*, *backend scripts* and *themes* — there is no official "plugin" concept. This tool was previously called "Plugin Manager"; the docs now use the official terms.

```
Render Note → Fetch registry → Show cards → Install / Update / Uninstall
```

---

## How it works

The Script Manager is a **JS Frontend Render Note**. On load, it fetches a registry (a JSON file hosted anywhere public), renders a card-based UI, and lets you install, update, or remove scripts/widgets.

**Two installation methods:**

| Method | How it works | Token needed? |
|--------|-------------|:---:|
| **`sourceUrl`** (recommended) | Downloads the `.js`/`.jsx` source directly and creates a code note | ❌ No |
| **`zipUrl`** (fallback) | Downloads a ZIP for manual import via Options → Import | ✅ Yes |

For the `sourceUrl` method, no ETAPI token is required — the script is created as a code note in one atomic backend call. No HTTP, no ZIP, no deadlock.

---

## Features

- **Install** scripts/widgets from a remote or local registry with one click
- **Search & sort** — filter by name, author, description or tag; sort by name, updates first or installed first
- **Registry validation** — entries with an invalid schema are flagged and skipped instead of breaking the list
- **Compatibility check** — an entry's `minAppVersion` blocks installing it on an older Trilium
- **Changelog** — optional `changelog` field shown on the card
- **Install warning** — a confirmation shows the source and warns that installed code runs with full API access
- **Host allowlist** — downloads are limited to `raw.githubusercontent.com` and `github.com`, over HTTPS
- **Update detection** — cards turn yellow when a newer version is available
- **Uninstall** — removes the script note cleanly
- **Remote registry** with automatic fallback to local note content
- **Source indicator** — shows remote/local source and last fetch time
- **Dual mode** — `sourceUrl` (zero-config) or `zipUrl` (legacy) per entry
- Inherits the active TriliumNext theme via CSS variables

---

## Quick Start

### 1. Create the required notes

```
Plugin Manager         ← Code note, MIME: application/javascript;env=frontend  (paste the JS code)
├── plugin-registry    ← Code note, MIME: application/json  (registry JSON + config labels)
└── Installed          ← Text note  (receives installed scripts as child notes)
```

### 2. Add labels

On **plugin-registry**:

| Label | Value | Required |
|-------|-------|:--------:|
| `#pluginRegistry` | *(no value — marks the note)* | ✅ |
| `#registryUrl` | URL to your `registry.json` | optional |

On **Installed**:

| Label | Value | Required |
|-------|-------|:--------:|
| `#installedPlugins` | *(no value — marks the note)* | ✅ |

> ℹ️ `#etapiToken` and `#triliumPort` are **no longer required** when your registry uses `sourceUrl` entries (recommended). They are only needed if you plan to install legacy `zipUrl`-based scripts.

### 3. Paste the code

1. Create a Code note with MIME `application/javascript;env=frontend`
2. Paste the contents of [`trilium-plugin-manager-v4.js`](./trilium-plugin-manager-v4.js)
3. Add a `~renderNote` relation pointing to the note where you want the panel to appear
4. Open the target note

### 4. (Optional) Set up a remote registry

Create a public [GitHub Gist](https://gist.github.com) with a `registry.json` file. Copy the Raw URL and add it as `#registryUrl` on the plugin-registry note.

---

## Registry format

```json
{
  "plugins": [
    {
      "id": "weekly-planner",
      "name": "Weekly Planner",
      "version": "1.0.0",
      "author": "your-github-username",
      "description": "Weekly planning board with columns.",
      "tags": ["productivity", "planning"],
      "sourceUrl": "https://raw.githubusercontent.com/user/repo/main/planner.jsx",
      "labels": [ { "name": "widget" }, { "name": "readOnly" } ],
      "zipUrl": "https://github.com/user/repo/raw/main/planner.zip"
    }
  ]
}
```

| Field | Required | Description |
|-------|:--------:|-------------|
| `id` | ✅ | Unique identifier — used to track installation state |
| `name` | ✅ | Display name shown in the UI |
| `version` | ✅ | Semver string (`1.0.0`) |
| `minAppVersion` | | Minimum Trilium version required (`0.105.0`) — install is blocked on older apps |
| `changelog` | | Short "what's new" text shown on the card |
| `author` | | Author name |
| `description` | | Short card description |
| `tags` | | Array of tag strings |
| `homepage` | | URL to the script's docs or repository — shows a "How to" button on the card |
| `sourceUrl` | | Raw URL to the `.js`/`.jsx` source file |
| `labels` | | Array of `{ "name", "value" }` applied to the created note in the single-file flow — e.g. `widget`, `readOnly` |
| `manifestUrl` | | Raw URL to a `manifest.json` for multi-note scripts (see below) |
| `zipUrl` | | Legacy URL to a Trilium export ZIP |

At least one of `sourceUrl`, `manifestUrl` or `zipUrl` must be provided.

Entries that fail schema validation — missing `id`/`name`/`version`, no URL at all, a non-`http(s)` URL, a `sourceUrl`/`manifestUrl` not hosted on `raw.githubusercontent.com`, a duplicate `id`, or a malformed `minAppVersion` — are listed in a warning panel and skipped instead of breaking the list. The same rules run as smoke tests — `bash test/run.sh`.

---

## Script formats

### Single-file (`sourceUrl`)

A single `.js` or `.jsx` file. The Script Manager downloads it and creates one code note.

```
sourceUrl → download → create code note → done
```

### Multi-note (`manifestUrl`)

For scripts that need multiple notes (widget + handler + config + render note). The `manifestUrl` points to a JSON file describing the notes to create:

```json
{
  "notes": [
    {
      "title": "My Plugin",
      "type": "text",
      "content": "Open this note to use the script.",
      "children": [
        {
          "title": "My Plugin Code",
          "type": "code",
          "mime": "application/javascript;env=frontend",
          "sourceUrl": "code.js"
        },
        {
          "title": "My Plugin Config",
          "type": "text",
          "content": "Configure the script here."
        }
      ]
    }
  ],
  "relations": [
    { "type": "renderNote", "from": "My Plugin", "to": "My Plugin Code" }
  ],
  "labels": [
    { "note": "My Plugin Code", "name": "readOnly", "value": "" },
    { "note": "My Plugin Config", "name": "myPluginConfig", "value": "" }
  ]
}
```

Each note can have a recursive **`children`** array: the parent note (e.g. the render note) is created first and the children (code, config, related notes) are created **inside it**, building a real tree in Trilium instead of flat notes. Notes with `sourceUrl` fetch the source file (relative to the manifest URL). Labels and relations from the manifest are applied automatically (labels/relations reference notes by title).

```
manifestUrl → download manifest → for each note: create + create its children → apply labels → create relations → done
```

### ZIP (`zipUrl`, legacy)

Downloads the ZIP to the user's browser for manual import via **Options → Import**. Requires an ETAPI token.

---

## Install flows

### `manifestUrl` install
1. Downloads the manifest JSON
2. Creates all notes described in the manifest
3. Applies labels and `~renderNote` relations
4. ✅ No token, no ZIP, no deadlock

### `sourceUrl` install
1. Backend downloads the source file via HTTPS
2. Creates a `code` note with MIME `application/javascript;env=frontend`
3. Sets `#pluginId`, `#pluginVersion`, `#pluginName` labels
4. Applies `labels` from the registry entry (e.g. `widget`, `readOnly`)
5. ✅ Done

### `zipUrl` install (legacy)
1. Downloads the ZIP to the user's browser
2. User imports manually via **Options → Import**

### Update detection
On every load, the manager compares the `version` field in the registry against the `#pluginVersion` label on each installed note:
- **Same version** → green card, `✓ v1.0.0`
- **Registry is newer** → yellow card, `↑ v0.5.0 → v1.0.0`
- **Not installed** → default card + **Install** button

---

## Files

| File | Description |
|------|-------------|
| `trilium-plugin-manager-v4.js` | **Main file** — paste into a JS Frontend note |
| `trilium-plugin-manager-v4.html` | Legacy HTML version (kept for reference) |
| `registry.json` | Example registry with official scripts |
| `test/registry-smoke.js` | Smoke test — validates `registry.json` schema |
| `test/manager-logic-smoke.js` | Smoke test — exercises the manager's logic with DOM stubs |
| `test/run.sh` | Runs `node --check` + both smoke tests (`bash test/run.sh`) |
| `PLUGIN_DEV_GUIDE.md` | Guide for creating and publishing scripts |
| `MANIFEST_GENERATOR.md` | Fill-in-the-blank prompt to generate manifest.json |

---

## Roadmap

- [x] Script changelog field (`changelog` on the registry entry)
- [ ] Startup update badge
- [ ] One-click "Export as script" helper note
- [ ] Integrity check (`sha256` per entry) for downloaded sources — currently blocked by the script sandbox (no `crypto` module available)

---

## License

MIT

## ☕ Support this project

**🇧🇷 Pix:** `ricardograca@ricolandia.com`  
**💳 PayPal:** [Donate](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=ricolandia%40gmail.com&currency_code=BRL)  
**🧡 GitHub Sponsors:** [github.com/sponsors/ricolandia](https://github.com/sponsors/ricolandia)

---

## Screenshots

![screen capture](imagens/manager.webp)
![screen capture](imagens/manager-2-.webp)



