# What a plugin is

A plugin is a package, such as a folder, an npm package or a Git repository, whose `package.json` has an `agzPlugin` manifest. The manifest lists what the package adds to AGZ Code. Some contributions are files the engine reads (skills, prompts, themes, agent definitions). Others are code the engine runs (tools, hooks, commands, MCP servers, providers), per session or once for the whole engine.

AGZ Code and AGZ's own plugin sources are private. You can write a plugin using this documentation, the MIT-licensed npm packages, and the templates and examples in the open `agzcode/agz-plugin-base` repository. A plugin of your own can be open or closed.

The manifest is described in [the manifest page](./manifest.md). To build your first plugin, go to [the quickstart](./quickstart.md).

## What a plugin can contribute

Manifest resources are plain files. A plugin lists them in `agzPlugin`.

| Resource | What it is | What AGZ Code does with it |
|---|---|---|
| `skills` | A folder with a `SKILL.md`, optionally with tools, scripts and examples | Agents find it with skill_route and load it with skill_load. Its tools are called from Code Mode. See [skill plugins](./skill-plugins.md). |
| `prompts` | A Markdown prompt template | It becomes a slash command named after the file. Its text expands with the arguments you type. |
| `themes` | A theme JSON file | The loader resolves it. The engine's UI context reports no themes (see the desktop limits below). |
| `agents` | A Markdown agent definition | It becomes a subagent profile. See the agents section of [the manifest page](./manifest.md). |

Extension code is a TypeScript or JavaScript module listed in `extensions`. It exports a factory that receives the plugin API, as described in [the extension API page](./extension-api.md). Through that API a plugin can:

| Contribution | API | Notes |
|---|---|---|
| Tools | `registerTool` | `direct` tools are given to the model; `codemode` and `deferred` tools are reached through Code Mode. `model-only` and `hidden` are also supported; see [the exposure rules](./extension-api.md). |
| Hooks | `on` | React to session, agent, message, tool and provider events. A `tool_call` hook can block a call. |
| Commands | `registerCommand` | Slash commands. The handler can use `ctx.ui`. |
| MCP servers | `registerMcpServer` | The engine's MCP extension connects the server for the session. |
| UI calls | `ctx.ui` | Dialogs, notifications, status text and widgets. |
| Plugin folders | `getPluginPaths` | The plugin's own `data`, `cache` and `logs` folders; see [Storage](./storage.md). |
| Views | `registerView` | A panel, a sidebar page or a status bar item the app draws from data; declared in `ui.views`. A status bar item is registered by the engine module. |

The manifest also declares things that need no call:

| Field | What it adds |
|---|---|
| `engine` | An engine module: code that runs once while the plugin is enabled, not once per session. For background work all sessions share. |
| `mcpServers` | MCP servers the engine registers in every session that loads the plugin, without extension code. |
| `settings` | A settings form under Settings > Plugins; a field can be a secret, and a field can be project-scoped. |
| `ui` | Views, and decorations of the plugin's own tool cards. |
| `bots` | Bot templates for Settings > Bots. |
| `systemPrompt` | Edits to the agents' system prompt. |
| `permissions` | What the plugin says it needs, shown before the install. |
| `access`, `accessNotes` | Experimental switches the user controls and the plugin's notes about them. See [Plugin access](./security.md#plugin-access). |
| `userContent` | Where the plugin keeps the user's own work, which no uninstall deletes. |

Every field is described on [the manifest page](./manifest.md).

A plugin can have several parts. A skill can ship the instructions and a script tool, while extension code adds a hook or an MCP server and an engine module keeps an index fresh.

## Where a plugin runs

- Extension code runs inside the engine, the process behind the desktop app. The engine can be on your machine or a remote one. The code has the engine user's permissions: it can read files, start processes and use the network. Install only code you trust.
- Extension code is loaded again for every session. An engine module is loaded once per engine and runs while the plugin is enabled, also with no session open. The two do not share variables.
- Tools registered from an extension file that no agent profile lists are added to every profile, including read-only explorer and verifier. Built-in tools without a file path are not added. A profile's read-only role does not by itself block a mutating plugin tool. Opt into [plugin access](./security.md#plugin-access) to let the engine restrict calls, and request approval in the tool before modifying, sending or deleting data.
- Skill script tools run as child processes of the engine. See [skill plugins](./skill-plugins.md).
- The app displays session UI requests from `ctx.ui`. An approved desktop interface module runs separately in the app window.
- A main session has a UI: a plugin's `session_start` handler sees `ctx.hasUI` as true. A subagent session loads the plugin's extension too, but there `ctx.hasUI` is false. Guard dialogs with `ctx.hasUI`.
- Plugin changes apply to new or reopened sessions. A running session keeps the extensions it loaded until you reload it (see Reloading below).

## Desktop limits

The engine implements `ctx.ui` for the desktop app. Not every call has a visible effect.

| Call | In the desktop app |
|---|---|
| `notify` | Shown as a notification in the session. |
| `select`, `confirm`, `input`, `editor` | Shown as a dialog. A cancel, a timeout or an abort returns `undefined` (`false` for `confirm`). |
| `setStatus` | Shown as a badge in the session header. |
| `setWidget` with a string array | Shown as plain text in a collapsible widgets section of the session header. The placement option is ignored. |
| `setWidget` with a component factory | Not shown. The engine sends one warning notification per widget key. |
| `setTitle` | Updates the session title. |
| `setEditorText`, `pasteToEditor` | Dropped: the engine has no protocol event for them, so the composer is not changed. |
| `getEditorText` | Always returns an empty string. |
| Themes | `getAllThemes` returns an empty list, `getTheme` returns `undefined` and `setTheme` returns `success: false`. |

The details are in [the extension API page](./extension-api.md).

## Sources and scope

You install a plugin from one of these sources in Settings > Plugins:

| Source | Form | What happens |
|---|---|---|
| Official | Listed in Settings > Plugins | Bundled with AGZ Code. You add or remove it with one button. |
| npm | `npm:@scope/name@1.2.0` | The engine runs `npm install` for it in a staging folder of the plugin store. The install scripts run only if you tick Run install scripts in the confirmation. |
| GitHub | `owner/repo`, `owner/repo@ref` or `github:owner/repo@ref` | Stored as `git:github.com/owner/repo@ref`. The engine clones it into a staging folder and installs it with `npm install --omit=dev --legacy-peer-deps --ignore-scripts`. The install scripts run (without `--ignore-scripts`) only if you tick Run install scripts in the confirmation. |
| HTTPS git URL | `https://host/path` without credentials | Same as GitHub. |
| Local folder | An absolute path on the engine's machine | The folder is recorded in the plugin store and read in place. Nothing is copied, so it suits development. The app shows a Development badge. |

An SSH address, `git@...`, `http://`, relative paths and archive files are refused.

Install and update need your confirmation, because they run third-party code. When the plugin declares permissions, the app shows them after the download and waits for a second confirmation. Extension code also runs in every session that loads the plugin.

Every plugin you install lives in one place, the plugin store `~/.agz-code/plugins/`: an npm or git package as a version folder there, a local folder as a record that points to it. (AGZ's own plugins that come with the app are read from the app's folder.) [Storage](./storage.md) describes the layout. Two rules follow from it:

- A plugin is known by its `agzPlugin.id`, and two installed plugins never share an id. Installing a package whose id is already installed from another source is refused with `a plugin with the id "<id>" is already installed (<source>); remove it first` (for a downloaded package the message ends with `, or update it`). Remove the installed one first, for example the local folder you developed in before you install the published package.
- A source is installed once. Installing the same source again for another project adds that project to its users; nothing is downloaded twice.

A plugin has a scope:

- User scope applies to every project of the engine.
- Project scope applies to one project. The project names the plugin in its `.agz-code/plugins.json`, which travels with the repository; the package itself is in the plugin store like any other. A project plugin loads only in a trusted project. In an untrusted project the list shows it read-only and sessions do not load it. You decide trust in the project's session or in the Project trust settings. A project can also turn a user plugin off for its own sessions.

## Reloading

After you add, update or remove a plugin, open sessions keep what they loaded. New or reopened sessions load the new set. Use Reload sessions in Settings > Plugins to apply the change to open sessions now. A session that is running reloads when its run ends. Subagents already running are not changed.

## Official plugins

AGZ Code ships these plugins. Each one brings skills bundled with the app; `audio-generation` and `3d-generation` also bring tools that live in the engine, listed below the table.

| Id | What it adds | Default |
|---|---|---|
| `excel` | Read and edit spreadsheets | On |
| `pdf` | Inspect and create PDF documents | On |
| `frontend-design` | Interface design guidance | On |
| `image` | Inspect and edit images | On |
| `audio-generation` | Generate speech, sound effects and music from a script | On |
| `3d-generation` | Generate GLB 3D models from a prompt or images | On |
| `plugin-dev` | The plugin development tools and this documentation | Off |

`audio-generation` brings the engine tools `generate_audio` and `audio_catalog`, and `3d-generation` brings `generate_3d` and `model3d_catalog`. Both need an API key of a provider set in Settings. Turning one off takes its engine tools out of the agent profiles for new sessions and new subagents.

In Settings > Plugins, open Available and press Add to turn one on. Remove turns it off again. The choice is stored in the `plugins` section of `agz.json` as `official` ids mapped to booleans.

Add `plugin-dev` to have agents scaffold and check plugins for you. Its tools are `paths`, `manifest_check`, `scaffold` and `pack_check`, used in [the quickstart](./quickstart.md).

### Updating an official plugin

The five skill plugins (`excel`, `pdf`, `frontend-design`, `image` and `plugin-dev`) ship inside the app. They can also get a newer signed version from code.agzyazilim.com without an app release. AGZ publishes the newer versions there in a signed index, and the engine reads that index only when you press Check for updates or Update in Settings > Plugins.

Press Update on the plugin's card and confirm. The engine downloads the archive and checks it before it uses it: the index must be signed with AGZ's plugin key (a key of its own, not the app update key); the archive must match the size and SHA-256 checksum in the index; and the skill folder must pass the checks of its files, tool definitions and vendor hashes. A downloaded copy is used only while its version is newer than the app's own, and only when this app and its plugin SDK meet the versions it requires. If the server cannot be reached or a check fails, nothing changes and the app shows the reason.

Use the app's version on the card returns to the copy the app ships. Open sessions keep the copy they loaded until you press Reload sessions.

A new skill version reaches open sessions through Reload sessions in Settings > Plugins; new sessions load it when they start.

Audio generation and 3D generation get their provider code this way later, once their provider packs ship. Until then they update only with the app.

## Engine and desktop contributions

- [Desktop interface modules](./manifest.md#desktop-interface-module) run a plugin's React code in the desktop window after approval on that device. Keep declarative views for fallback.
- [Status bar views](./manifest.md#status-bar-views) show an indicator and a panel supplied by an engine module.
- [Native subprocesses](./manifest.md#native-subprocesses) run platform-specific executables declared in the manifest and verified by hash.
- [Background helpers](./manifest.md#background-helpers) run jobs on the engine using manual, scheduled, or event triggers.
- [Model providers](./manifest.md#model-providers) register OpenAI-compatible endpoints from an engine module with `engine.providers.register()`.
- [Notifications and quotas](./manifest.md#notifications-and-quotas) let an engine module notify the user and read provider quotas with the corresponding permissions.

[Signed catalog releases](./testing-packaging.md#signed-releases-in-the-public-catalog) require the catalog operator to certify your publisher and approve each release.

## Next

- [Quickstart](./quickstart.md): build, link and call a plugin.
- [The manifest](./manifest.md): every field and rule.
- [The extension API](./extension-api.md): tools, hooks, commands and more.
- [Skill plugins](./skill-plugins.md): skills with tools.
- [Storage](./storage.md): where plugins, settings and data are kept.
- [Example plugins](./examples.md): the templates and examples of the open repository.
