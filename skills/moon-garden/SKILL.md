---
name: moon-garden
description: Preview, start, configure, diagnose or remove the GPT Moon Garden Codex desktop skin and companion. Use for this plugin's appearance controls; not for unrelated themes or generating new characters.
---

The plugin root is two directories above this skill. The runtime is self-contained Node.js 22+ code in `scripts/controller.mjs`; no npm dependencies are required. Run `node scripts/controller.mjs` from the plugin root using the available terminal executor; its output prints the loopback manager URL. If system Node is absent, use a bundled Node runtime returned by the workspace-dependencies tool when available. Windows users can also double-click `Start.cmd` and keep its console open. No hidden startup or autostart mechanism is installed.

- For a preview, open `preview/index.html` using the app's file/browser panel. No live client connection is necessary.
- For activation/configuration, run the manager, open its printed URL, and let the user choose Apply. Installation alone does not apply a skin.
- For diagnostics, run `node scripts/controller.mjs --doctor`. A missing CDP endpoint is a setup condition, not a reason to kill or restart the host. `docs/INSTALL.md` explains a dedicated launcher for a later natural app launch.
- For updates, replace the installed `assets/`, `theme/` and `renderer/` files with the selected trusted release. The controller notices changes and reinjects visuals while preserving local appearance choices. Updating controller/plugin code itself needs a controller restart or plugin reload. Do not promise zero-restart host upgrades.
- For restoration, use Restore in the manager. Only this plugin's styles, DOM and listeners are removed. Never overwrite Codex settings, conversations, account data or installation files.

The manager connects only to a user-enabled loopback CDP endpoint. Never terminate ChatGPT/Codex, change its startup arguments while it is running, expose a debug port to a network, or apply the skin when the request was only for preview/publication. Do not copy credentials into the project. This is an experimental community skin adapter, not an official global-theme extension API. Use `docs/ARCHITECTURE.md` when changing integration behavior.
