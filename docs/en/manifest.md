# The agzPlugin manifest

The manifest is the `agzPlugin` key of the package's `package.json`. It is the only thing that tells AGZ Code what the package contains. Ordinary npm fields (`name`, `version`, `files`, `dependencies`) stay at the top level of `package.json`; plugin fields go inside `agzPlugin`.

This example uses the identity fields and every resource field. `manifest_check` accepts it with the files in the layout below. The other fields (`engine`, `mcpServers`, `userContent`, `permissions`, `settings`, `ui`, `bots` and `icon`) have their own sections further down.

```json
{
	"name": "@example/agz-plugin-tools",
	"version": "1.0.0",
	"type": "module",
	"files": ["extensions", "skills", "prompts", "themes", "agents"],
	"agzPlugin": {
		"schemaVersion": 1,
		"id": "example/tools",
		"name": "Example Tools",
		"description": "Tools and instructions for a focused workflow.",
		"publisher": "Example",
		"homepage": "https://example.com/plugins/tools",
		"extensions": ["extensions/index.ts"],
		"skills": ["skills/*", "!skills/legacy", "+skills/extra", "-skills/extra"],
		"prompts": ["prompts", "!draft-*.md"],
		"themes": ["themes/*.json"],
		"agents": ["agents/reviewer.md"],
		"systemPrompt": "system-prompt.json"
	}
}
```

The layout it expects:

```
extensions/index.ts
skills/review/SKILL.md
skills/legacy/SKILL.md
skills/extra/SKILL.md
prompts/review.md
prompts/draft-one.md
themes/dark.json
agents/reviewer.md
system-prompt.json
```

For this package `manifest_check` returns `ok: true` and these enabled files: `extensions/index.ts`, `skills/review/SKILL.md`, `prompts/review.md`, `themes/dark.json` and `agents/reviewer.md`. The `legacy` and `extra` skills and the `draft-one.md` prompt are switched off by the override entries, which are explained below.

## Fields

An explicit manifest is strict: an unknown field is an error.

| Field | Type | Rule |
|---|---|---|
| `schemaVersion` | number | Required. Exactly `1`. |
| `id` | string | Required. `<publisher>/<name>`; see [The plugin id](#the-plugin-id). |
| `name` | string | Optional. |
| `description` | string | Optional. |
| `publisher` | string | Optional. |
| `homepage` | string | Optional. An `https` URL without a user name or password. |
| `icon` | string | Optional. One package-relative png, webp or svg file of at most 32 KB; see [Icon](#icon). |
| `extensions` | string array | Optional. Extension code entries, or folders and globs that contain them. |
| `skills` | string array | Optional. Skill folders, each with a `SKILL.md`. |
| `prompts` | string array | Optional. Markdown prompt templates. |
| `themes` | string array | Optional. Theme JSON files. |
| `agents` | string array | Optional. Markdown agent definitions. |
| `systemPrompt` | string | Optional. One package-relative JSON file of system prompt edits; see [System prompt edits](#system-prompt-edits). |
| `engine` | string | Optional. One package-relative module the engine loads once while the plugin is enabled; see [Engine module](#engine-module). |
| `mcpServers` | object | Optional. At most 16 MCP servers, by name; see [MCP servers](#mcp-servers). |
| `userContent` | object array | Optional. At most 16 places where the plugin keeps the user's own work; see [User content](#user-content). |
| `permissions` | string array | Optional. What the plugin says it needs; see [Permissions](#permissions). |
| `settings` | object array | Optional. At most 32 fields the user fills in under Settings > Plugins; see [Settings, views and bot templates](#settings-views-and-bot-templates). |
| `ui` | object | Optional. `views` (at most 8) and `toolViews` (at most 32) the app draws; see the same section. |
| `bots` | object array | Optional. At most 8 bot templates for Settings > Bots; see the same section. |

`name`, `description`, `publisher` and `homepage` must be non-empty strings of at most 4096 characters with no control characters.

Each resource field is an array of at most 1000 entries. An entry is a non-empty string of at most 1024 characters, with no control characters, no backslash and no leading or trailing space.

## The plugin id

The id is `<publisher>/<name>`, for example `acme/notes`. Each part is 1 to 63 characters: lowercase letters, digits, `.`, `_` or `-`, and its first character is a letter or a digit. The publisher part is a name you choose for everything you publish; use the same one in all your plugins. The `agz` publisher is reserved for AGZ's own plugins.

A bare id without a publisher (`notes`, 1 to 128 of the same characters) is still accepted: it is the form of plugins written before publishers existed. Give a new plugin a publisher.

The id is what identifies the plugin on a machine. Two installed plugins never share one: a second install with an id that is already installed is refused, from whatever source it comes. The id also names the plugin's files in the plugin store, with `/` written as `+` (see [Storage](./storage.md#keys)), so do not change it after you publish: a plugin with a new id is another plugin, without the settings and the data of the old one.

A package without an `agzPlugin` manifest gets an id derived from its package name: `@scope/name` becomes `scope/name`.

## Path rules

Every entry is a package-relative path that uses `/`.

- The path must stay inside the package. An absolute path, a drive path such as `C:`, and any `..` segment are rejected. A leading `~` is an ordinary name, not the home directory.
- Every resolved file and folder must stay inside the package after symbolic links are resolved. A symlink that points outside the package is an error, for files and for folders.
- An entry can be a file, a folder or a glob. A glob is an entry that contains `*`, `?`, `{` or `[`. Glob matches are sorted. A glob match whose path has a segment that starts with `.` is skipped.
- A folder is searched recursively. Names that start with `.` and `node_modules` are skipped.
- Every declaration must match at least one resource file. A path that does not exist, a glob without matches and a folder with no files of the right kind all fail with the same error (see Errors below).

What a field resolves to:

| Field | Files it accepts |
|---|---|
| `extensions` | `.ts` and `.js` files. A folder that has `index.ts` or `index.js` resolves to that file. A folder with its own `package.json` manifest resolves to that manifest's `extensions`. Otherwise every `.ts` and `.js` file inside it. |
| `skills` | A folder that holds `SKILL.md` resolves to that `SKILL.md` and is not searched further. Inside a folder without one, loose files are ignored and the subfolders are searched. |
| `prompts` | `.md` files. |
| `agents` | `.md` files. |
| `themes` | `.json` files. |

A `skills` entry that points to a Markdown file other than `SKILL.md` is accepted by the manifest, but AGZ Code loads only skill folders with a `SKILL.md`, so the file does nothing. Put standalone instructions in a skill folder or in `prompts`.

## Overrides: `!`, `+` and `-`

An entry that starts with `!`, `+` or `-` is an override, not a source. It changes which of the resolved files are enabled. An override does not count as a declaration, so it never triggers the missing-files error on its own, and an override-only field resolves to nothing.

| Entry | Meaning |
|---|---|
| `!pattern` | Excludes every resolved file that the pattern matches. The pattern is a glob. It is compared with the file path relative to the package and with the file name. A `./` prefix is ignored. |
| `+path` | Enables a resolved file again. The path is an exact match. |
| `-path` | Disables a resolved file. The path is an exact match. |

For a skill, the exact path and the pattern can be the skill folder (`skills/legacy`) or its `SKILL.md`.

The order is fixed: exclusions (`!`) are applied first, then `+` re-enables, then `-` disables. So `-` always wins. An override cannot add a file that the sources did not resolve.

In the example above, `skills/*` resolves three skills, `!skills/legacy` drops `legacy`, and `-skills/extra` drops `extra` even though `+skills/extra` enabled it first. `prompts` resolves both prompts, and `!draft-*.md` drops `draft-one.md` by its file name.

## System prompt edits

`systemPrompt` names one JSON file, relative to the package, with edits to the agent system prompt. Use it to add a block or a section, or to change a block's text. It follows the path rules above for one file: inside the package, no `..`, no absolute path and no backslash. It names a file, not a glob, and it is not an override. Do not use `prompts` for this: that field holds prompt templates.

```json
{
	"all": [
		{
			"op": "add",
			"section": "working",
			"after": "base.working.ground-claims",
			"id": "example.tools.cite-sources",
			"text": "- Name the file and line for each claim about code."
		}
	],
	"agents": {
		"lead": [
			{
				"op": "replace",
				"target": "base.working.failed-calls",
				"base": "0000000000000000",
				"text": "- Read the real state before you repeat a failed call."
			}
		]
	}
}
```

`all` applies to every agent. `agents` holds one list per agent id, and that list applies to that agent only. The engine lists each block with its id and its `base` hash (the hash of the block's current engine text) in the system prompt view, Settings > Agents > System prompt. The `base` above is a placeholder: copy the real value from there.

Each op has an `op` field:

| `op` | Fields | Effect |
|---|---|---|
| `replace` | `target`, `base`, `text` | Replaces the text of the block `target`. |
| `remove` | `target`, `base` | Removes the block `target`. |
| `add` | `section`, `after` (optional), `id`, `text` | Adds a block to `section`, after the block `after`, or at the end of the section. |
| `add-section` | `after` (optional), `id`, `heading`, `blocks` | Adds a section with `heading` and the blocks `{id, text}`, after the section `after`, or at the end. |

The rules:

- A block id has the form `<document>.<section>.<slug>`, for example `base.working.ground-claims`.
- `base` must equal the hash of the block's current text. The engine applies a `replace` or `remove` only then. After an engine update changes that text, the op is `stale`: it is not applied, and Settings shows it.
- A plugin may only add in the closed sections `identity`, `role`, `instructions-and-trust` and `approval-modes` (the bot approval contract). A `replace` or `remove` there is an error, and the engine shows it as `locked`.
- New ids (the `id` of an `add` or `add-section`, and the `id` of each block of an `add-section`) must be unique in their list (`all`, or one agent's list). A new id that the prompt already holds is a conflict, and that op does not apply. Start each new id with your plugin id, such as `example.tools.cite-sources`, so that two plugins do not pick the same one.
- An `after` that names no block (for `add`) or no section (for `add-section`) puts the piece at the end: of its section for `add`, of the prompt for `add-section`. Settings marks it as added.
- A list may change a target once. A second `replace` or `remove` of the same target in one list is an error, and the engine refuses the whole file. The same target in `all` and in an agent's list is allowed: for that agent its own op applies and the `all` op is overridden.
- Limits: 200 ops per list, 20,000 characters per text, 100 blocks per `add-section`, 200 characters per id and per heading, 512 characters per agent id, and 32,768 characters of text in the whole file (every `text`, heading and block text, in `all` and in every agent's list together). A file over a limit is refused. An unknown field, at any depth, is an error, so check the spelling (`agents`, not `agent`).
- Precedence: a user's edit in Settings wins over a plugin's edit of the same target, and an agent's own list wins over `all`. When two plugins change the same target, neither applies, and Settings shows the conflict.
- The user sees the file's ops when the plugin is installed and confirms the install, and again in Settings > Plugins.

`manifest_check` and the engine read the file by one rule set: the shape and unknown fields, the limits, the repeated target and new id in a list, and the file's text total. The engine marks a `replace` or `remove` in a closed section `locked` and applies the rest of the file; `manifest_check` reports it as an error, so fix it before you publish. `manifest_check` also checks the path rules. It does not know the engine's blocks, so it cannot check that a target exists, that `base` is current or that a new id is free. The engine reports those as the op statuses `not-applicable`, `stale`, `conflict` and `anchor-missing`, and Settings shows them.

The reasons `manifest_check` gives for the field:

| Reason | Cause |
|---|---|
| `agzPlugin.systemPrompt must be one package-relative file path (at most 1024 characters, without backslashes or control characters)` | The value is not a string, is longer than 1024 characters, has a backslash, a control character or a surrounding space, or leaves the package (an absolute path, a drive path or a `..` segment). |
| `agzPlugin.systemPrompt file is missing or unreadable: <path>` | No file at the path, or the path cannot be resolved. |
| `agzPlugin.systemPrompt path must stay inside the package (after resolving symlinks): <path>` | A symlink leads outside the package. |
| `agzPlugin.systemPrompt must be a file: <path>` | The path is a folder. |
| `agzPlugin.systemPrompt file could not be read: <path>` | The file exists but cannot be read. |
| `agzPlugin.systemPrompt file is not valid JSON: <path>` | The file does not parse. |

Reasons inside the file start with its path, `<path>: `, one per problem. `<where>` is `all[<n>]` or `agents.<id>[<n>]`, the position of the op in its list:

| Reason | Cause |
|---|---|
| `must be a JSON object with all and agents` | The top level is not an object. |
| `unknown field <name>` | A key other than `all` and `agents`. |
| `all must be an array of at most 200 ops` | `all`, or `agents.<id>` named in the reason, is not an array or is too long. |
| `agents must be an object of op arrays` | `agents` is not an object. |
| `agent id "<id>" must be 1 to 512 characters without control characters` | A bad agent key. |
| `<where>.op must be replace, remove, add or add-section` | An unknown op kind. |
| `<where> has an unknown field <name>` | A field that the op kind does not take. |
| `<where>.<field> must be ...` | A missing or malformed field: an id, the 16-character hash, a text of 1 to 20,000 characters or a heading of 1 to 200 characters. |
| `<where>.blocks must be an array of at most 100 objects`, `<where>.blocks[<i>].id` or `.text` | A bad `add-section` block. |
| `<where> replaces <id>, which is locked: ...` or `removes <id>, which is locked: ...` | A `replace` or `remove` in a closed section. |
| `new id <id> is declared twice in all` or `in agents.<id>` | An id that two ops of the same list declare. |
| `block <id> is edited by two ops in all` or `in agents.<id>` | Two `replace` or `remove` ops of the same list name one target. |
| `the file writes <n> characters of text in all its lists; at most 32768 are allowed` | The text of all ops together is over the file limit. |

Warnings, which do not refuse the file: `<path>: new id <id> is declared in all and in agents.<id>; for <agent> the second one is a conflict and does not apply`, and `<path>: the file has no ops, so the plugin changes no prompt`.

## Settings, views and bot templates

Three fields add what the user sees and fills in. None of them runs plugin code in the app: the app draws data that the engine validates. Every user-facing text is `{ "en": ..., "tr": ... }` (at most 200 characters per language; a bot description 1000), and both languages are required.

`settings` declares fields. A field has a `key` (a letter, then letters, digits or `_`, at most 64 characters; unique), a `type` and a `label`, and may have a `description`. The types are `string` (`default`, `maxLength`), `number` (`default`, `min`, `max`, `integer`), `boolean` (`default`), `enum` (`options` of `{ value, label }`, `default`) and `secret` (no default; the app never reads it back and shows only its last four characters). The values are stored in the plugin store, in `config/<key>.json`, and the secrets in the store's `secrets.json` (see [Storage](./storage.md#settings-and-secrets)); the extension reads both with `getPluginSettings()` (see [the extension API](./extension-api.md#plugin-settings-and-views)).

```json
"settings": [
	{ "key": "endpoint", "type": "string", "label": { "en": "Endpoint", "tr": "Adres" }, "default": "https://api.example.com" },
	{ "key": "apiToken", "type": "secret", "label": { "en": "API token", "tr": "API anahtarı" } },
	{ "key": "testCommand", "type": "string", "scope": "project", "label": { "en": "Test command", "tr": "Test komutu" }, "default": "npm test" }
]
```

A field with `"scope": "project"` is project-scoped: a trusted project may keep its own value of it, in `<project>/.agz-code/plugin-config/<key>.json`, and that value wins over the user's value in the sessions of that project. `getPluginSettings()` returns the value that applies to the session's project, so the extension reads it like any other field. `"project"` is the only value `scope` takes, and a `secret` field cannot have it. Use it for what differs between repositories, such as a command, a path or a naming rule.

`ui.views` declares the views the extension registers with `registerView`. A view has an `id` (1 to 64 lowercase letters, digits, `.`, `_` or `-`; unique), a `title`, an `icon` (a lucide name from a fixed list; `manifest_check` names the list when the value is wrong) and a `place`: `panel` (a view in the session's right panel), `sidebar` (a page in the app's sidebar for the project), `composer` (a compact bar above the session's composer; the extension registers it with `registerView`, as for `panel`, and a view with nothing to show draws nothing) or `statusbar` (an item in the app's status bar with a panel that opens from it). A `statusbar` view belongs to the engine, not to a session: the [engine module](#engine-module) registers it, so the manifest needs `engine`, and it may have `refreshSeconds` (a whole number from 1 to 3600): how often the app asks for the view again while it shows the item. `ui.toolViews` decorates the card of one of the plugin's own tools: `tool` (the tool name; unique), and any of `card`, `title`, `subject`, `facts` (at most 8) and `sections` (at most 8). Set `card: "agent"` to display calls with the agent card style instead of the standard tool card. Each value is read from the call with `from` (`args` or `result`) and `key` (a dotted path of at most 8 names); a section also has `as` (`text`, `json`, `kv`, `list` or `markdown`). Use `as: "markdown"` to render a string as Markdown, for example the answer at `result.text`. The card still shows the full arguments and result.

A fact may have `values`, an object mapping up to 32 raw values to localized `{ en, tr }` labels. Each key must contain 1–64 characters. An unmatched value is shown unchanged.

```json
"ui": {
	"views": [{ "id": "status", "title": { "en": "Status", "tr": "Durum" }, "icon": "gauge", "place": "panel" }],
	"toolViews": [{
		"tool": "notes_helper_echo",
		"title": { "en": "Echo", "tr": "Yankı" },
		"subject": { "from": "args", "key": "text" },
		"facts": [{ "label": { "en": "Length", "tr": "Uzunluk" }, "from": "result", "key": "length" }]
	}]
}
```

A `composer` view is declared like a `panel` view, with `"place": "composer"`; the extension registers it with `registerView`. The manifest declares no slash commands: the extension registers them with `registerCommand`, and its `button: true` is what lets an agent offer a command as a button (see [the extension API](./extension-api.md#commands)).

`bots` declares bot templates. A template is not a bot: Settings > Bots lists it, and the user opens a form prefilled with it and decides whether to create the bot. A template has an `id` (like a view id), a `name` (the bot's name: a letter, then lowercase letters, digits or `-`, 2 to 48 characters; unique), a `description` and a `brief`: a package-relative file with the bot's `BOT.md` text (the same path rules as `systemPrompt`; at most 20,000 characters, not empty). It may suggest `suggestedPermissions` (a text of at most 12,000 characters) and `suggestedApproval` (`report` or `final`); the form shows a suggestion and applies it only when the user accepts it.

```json
"bots": [{
	"id": "triage",
	"name": "triage-bot",
	"description": { "en": "Sorts new issues.", "tr": "Yeni sorunları ayırır." },
	"brief": "bots/triage.md",
	"suggestedApproval": "report"
}]
```

`manifest_check` checks all three fields with the loader's rules, and that each `brief` file exists, is a file and stays inside the package after symlinks are resolved. It reads no more than that: it does not check that the extension registers each declared view, or that a tool named in `toolViews` exists.

## Engine module

`engine` names one module, relative to the package (`.ts`, `.mts`, `.js` or `.mjs`), that the engine loads once while the plugin is enabled, whatever the number of sessions. Extension code (`extensions`) runs again in every session; the engine module is the place for what all sessions of the plugin share: a background task, a timer, a cache, a connection.

```json
"engine": "engine/index.ts"
```

The module's default export is a factory. It gets the engine API and may return the function that stops what it started:

```ts
import type { PluginEngineFactory } from "@agz-yazilim/plugin-sdk/unstable";

const start: PluginEngineFactory = (engine) => {
	const timer = setInterval(() => engine.log("still running"), 60_000);
	return () => clearInterval(timer);
};

export default start;
```

| Member | What it is |
|---|---|
| `engine.pluginId` | The plugin's id. |
| `engine.paths` | The plugin's `data`, `cache`, `logs` and `package` folders (see [Storage](./storage.md#plugin-folders)). |
| `engine.signal` | An `AbortSignal` that aborts when the module must stop. Pass it to what the module starts. |
| `engine.getSettings()` | The plugin's settings as they are now: saved values with defaults applied, secrets included. |
| `engine.onSettingsChange(listener)` | Calls `listener` with the new settings after the user saves them. Returns the function that removes the listener. |
| `engine.log(message)` | Writes a line to the engine's log, marked with the plugin's id. |
| `engine.host` | The engine the module runs in: `version`, and `stats()` with the sessions in memory, the connected clients, the messages and bytes sent to them since the start, and the agents' running background commands. |
| `engine.registerView(id, view)` | Registers a status bar view (below). |
| `engine.invalidateView(id)` | Says a registered view changed: the app renders it again. |
| `engine.notify({ title, body? })` | Notifies the user (below). Needs the permission `notifications`. |
| `engine.quotas` | The provider quotas the engine knows: `list()` and `onChange(listener)`. Needs the permission `usage`. |
| `engine.handle(method, handler)` | Answers the calls of a method of the plugin channel (below). Returns a function that removes the handler. |
| `engine.publish(topic, data)` | Sends data to the clients subscribed to a topic. |
| `engine.onSubscribers(topic, listener)` | Calls the listener with the number of clients subscribed to a topic, now and whenever it changes. |

### Model providers

A user-scope engine module with `providers` permission can call `engine.providers.register({ id, name, baseUrl, models, secretSetting })`. This unstable API contributes OpenAI-compatible chat models to the model picker. The address must use HTTPS (plain HTTP is allowed only on loopback for local testing), without credentials, a query or a fragment. `secretSetting` is the name of a declared `secret` field belonging to the plugin; do not put a key in the registration, manifest or log. Each model supplies `id`, `name`, `contextWindow` and `maxTokens`. An engine module can register at most 16 providers, each with at most 32 models.

A registration made during startup takes effect only if the module starts successfully. The returned function removes that registration; disabling or stopping the plugin also removes it. The engine gives the provider an id of its own rather than replacing a configured provider. A conversation reaches the registered endpoint only when the user selects and uses one of those models.

### Status bar views

A view declared with `place: "statusbar"` is an item in the app's status bar and a panel that opens from it. On a phone, which has no status bar, the items are at the top of Settings.

```json
"engine": "engine/index.ts",
"ui": { "views": [{ "id": "queue", "title": { "en": "Queue", "tr": "Kuyruk" }, "icon": "list-checks", "place": "statusbar", "refreshSeconds": 30 }] }
```

```ts
engine.registerView("queue", {
	render: (ctx) => ({
		status: { items: [{ label: ctx.locale === "tr" ? "Kuyruk" : "Queue", value: String(waiting.length), tone: waiting.length > 10 ? "warning" : "neutral" }] },
		sections: ctx.statusOnly ? [] : [{ blocks: [{ kind: "table", columns: [{ key: "job", label: "Job" }, { key: "age", label: "Age", align: "end" }], rows: waiting }] }],
	}),
});
```

- `status.items` are the readouts in the bar, at most 4: a `value` of at most 40 characters, an optional `label`, a `tone` that colours the value, and `ring` (0 to 100) to draw a small ring filled to that percent. With no items the app does not show the item, which is how a view says it has nothing to report now. Without `status` the item shows the view's icon and title.
- `sections` are the panel. The app asks for the whole view only while the panel is open; otherwise `ctx.statusOnly` is true and the sections can be left out, so a view polled every few seconds stays cheap.
- The app asks again every `refreshSeconds` while its window is shown, after `engine.invalidateView(id)`, and after an action. It does not ask while the window is hidden. A module that samples something for the view can therefore sample only while it is asked, and stop a little after the last request.
- `ctx.cwd` is the user's home directory: an engine view has no session and no project.
- `registerView` throws for an id the manifest does not declare with `place: "statusbar"`, and for a second registration. A session's extension cannot register such a view, and a `status` in a `panel` or `sidebar` view is refused.
- The view is gone when the module stops.

### Notifications and quotas

`engine.notify({ title, body })` tells the user something that happened while they were not looking: the app adds it to its notification list and shows a desktop notification when the user allows those, and the phone gets it when push is on. Each text is a string or `{ en, tr }`; the title has at most 120 characters and the body at most 500. The app names the plugin with every notice, so the text need not. At most 6 notices a minute reach the user; the rest are dropped and logged. Notify about what the user asked the plugin to watch, once, and keep a note of what was already said in the plugin's data folder: a notice is not a log.

`engine.quotas.list()` returns the last quota snapshot of each provider the engine has heard from: `provider`, `subscription`, `status`, `plan?`, `limitReached?`, `observedAt?` and `windows` (`id`, `usedPercent`, `resetAt?` in epoch milliseconds, `windowSeconds`). `engine.quotas.onChange(listener)` calls the listener with a provider's new snapshot. The engine reads the quotas from the providers and forgets them when it restarts; a plugin reads them and cannot change them.

Both need their permission in `agzPlugin.permissions` (`notifications`, `usage`): without it the call throws, so the user saw what the plugin does before it ran.

### Automation event sources

With the `automations` permission, `engine.automations?.registerSource({ id, title, subjectLabel, subjects })` returns a publisher scoped to the running plugin and source. The app lists these sources in Automations. The user chooses one subject and an action; neither a target nor a prompt is accepted by the publisher. `subjects()` must return up to 64 allowed entries synchronously, without I/O, and drop them when the plugin’s access is revoked. A subject ID must change when its security boundary changes (for example, a linked account change).

Publish `{ eventId, subjectId, timestamp, subjectRef?, reference?, hasMedia? }` with an epoch-millisecond timestamp. Use bounded IDs, not message bodies, instructions, or secrets. `accepted` means queued in memory; `duplicate`, `inactive`, and `busy` do not mean delivered. Intake and the scheduler are bounded. There is no automatic retry or restart replay; cooldown, quiet hours and hourly limits still apply. The old `engine.publish` client channel does not trigger automations.

### The plugin channel

The channel carries the plugin's own data between its engine module and a client of the engine. A client calls a method by name and gets its result, or subscribes to a topic and gets what the module publishes on it.

```ts
export default function start(engine: PluginEngineAPI) {
	let timer: ReturnType<typeof setInterval> | undefined;
	engine.handle("issues.list", async (params, ctx) => {
		const { state } = params as { state: "open" | "closed" };
		return { issues: await listIssues(state, ctx.signal) };
	});
	// Poll only while a client watches the topic.
	engine.onSubscribers("issues.changed", (count) => {
		if (count > 0 && timer === undefined) timer = setInterval(async () => engine.publish("issues.changed", { open: await countOpen() }), 60_000);
		if (count === 0 && timer !== undefined) {
			clearInterval(timer);
			timer = undefined;
		}
	});
	return () => clearInterval(timer);
}
```

- A method or topic name is a letter, then letters, digits, `.`, `_` or `-`, at most 64 characters. A method has one handler; `handle` throws for a second one.
- The params, a result and published data are JSON of at most 262144 characters. What the client gets is what JSON carries: a `Date` arrives as a string, `undefined` fields are dropped, and a handler that returns nothing answers `null`. A result that is not JSON or is too large fails the call; `publish` throws for such data.
- A handler has 30 seconds; `ctx.signal` aborts when they pass or the module stops. A throw reaches the caller as a failure with the error's message, so write messages a user can read and keep secrets out of them.
- `publish` sends nothing while no client is subscribed. Events are not stored: a client that subscribes later gets what is published from then on, so offer a method that returns the current state.
- A subscription names the plugin and the topic, not the running module: it stays while the module restarts (an update, a reload) and the new module hears its count from `onSubscribers`.
- Every client that is connected to the engine with a valid token can call the methods: the app's windows, a phone. Check the params as input from outside, and do not offer a method that does what the user was never asked about.
- On the wire these are the protocol requests `plugins.call`, `plugins.subscribe` and `plugins.unsubscribe` and the event `plugins.event` (capability `plugin_channel`). Today the app has no place where a plugin's own code calls them; the status bar item, the panel and the sidebar page are drawn from view data. The channel is what a plugin's interface module will use.

The rules:

- The module starts when the engine starts, and when the plugin is installed or turned on. It stops when the plugin is turned off, updated or removed, and when the engine stops: `engine.signal` aborts, then the returned function is called and the engine waits up to 10 seconds for it. After an update the new version's module starts.
- Only a plugin of the user scope has an engine module. A project plugin's `engine` is not loaded: the engine does not belong to one project.
- The module has 30 seconds to be imported, and its factory another 30 seconds to return. A module that fails to load, or whose factory throws or does not return in that time, is recorded in the engine's log as `did not start` and left out; the plugin's sessions still load. `engine.signal` aborts then, and a stop function the factory returns after the limit is called at once. The engine starts the modules one after another, so return quickly: do slow work (a first network request, a long scan) in the background instead of awaiting it in the factory.
- The module and the extension code do not share variables: they are loaded apart. Exchange state through files in the plugin's `data` folder, or through the settings.
- These types come from the SDK's `unstable` entry point: they are new and may still change in a minor version. Import them with `import type`.

The file follows the path rules for one file, as `systemPrompt` does.

## MCP servers

`mcpServers` declares the MCP servers the plugin brings, by name. The engine registers them in every session that loads the plugin, before any extension code runs, so a plugin without extension code can bring a server.

```json
"mcpServers": {
	"word-count": {
		"command": "node",
		"args": ["${pluginDir}/server/index.mjs"],
		"description": "Count the words and lines of a text"
	}
}
```

- A name is letters, digits, `_` and `-`. There are at most 16 servers.
- A config has the fields `registerMcpServer` takes (see [the extension API](./extension-api.md#mcp-servers)): a stdio server has `command`, `args`, `env` and `cwd`; an HTTP server has `url` and `headers`.
- In a stdio server's `command`, `args`, `cwd` and `env` values, `${pluginDir}` stands for the installed package folder. `cwd` defaults to that folder. Always name files of the package through `${pluginDir}`: the folder changes with every update.
- The engine lists declared servers without running plugin code, so the server shows in Settings > Agents > Tools as soon as the plugin is installed. An agent still calls its tools only after the user grants it the server.
- A name another plugin already declares is not registered, and the later plugin gets the error `MCP server "<name>" of plugin <id> was not registered: another plugin already declares that name`. A declared name cannot be registered again from code either: `registerMcpServer` with that name throws.

Declare a server here when its configuration is fixed. Register it from extension code when the configuration depends on a setting or on the session.

## User content

`userContent` lists the places outside the plugin's own folders where the plugin keeps what belongs to the user, such as designs or documents. No uninstall deletes them, and the app shows the list so the user knows where that work is. A place inside the plugin's own `data`, `cache` or `logs` folder is not user content: those folders go when the plugin is removed with its data.

```json
"userContent": [
	{ "path": "project:designs", "description": { "en": "The designs you made", "tr": "Yaptığın tasarımlar" } }
]
```

A `path` is `project:<relative path>`, under the session's project folder, or `home:<relative path>`, under the AGZ Code home folder `~/.agz-code/`. The relative path follows the rules for one file path: no `..`, no backslash, no control characters. A path appears once. The `description` is text in both languages, at most 300 characters each. There are at most 16 entries.

The field is a statement: it does not create the folder and gives no access. What the plugin can rebuild or needs for itself belongs in its own folders instead.

## Permissions

`permissions` says what the plugin needs. The user sees the list before the plugin is installed.

```json
"permissions": ["network", "secrets"]
```

| Permission | The plugin |
|---|---|
| `network` | talks to hosts outside the machine |
| `filesystem` | reads or writes files outside its own folders and the session's project |
| `process` | starts programs |
| `native` | ships and runs its own binaries |
| `ui` | adds its own code to the app's window |
| `secrets` | keeps credentials |
| `sessions` | reads or drives sessions other than the one that loaded it |
| `memory` | reads or writes the general memory |
| `git` | changes the project's repository |
| `notifications` | notifies the user |
| `usage` | reads the provider quotas and usage figures |
| `automations` | supplies events to rules and targets the user configures |
| `agents` | runs its own exclusive agent profiles with `ctx.agents.run` and registers helpers |
| `designer` | shows a preview of the trusted session project's design |
| `providers` | adds models; when used, the conversation goes to the named provider |

The list has no repeats and only these names. The host checks permissions on calls such as `ctx.agents.run`, `engine.notify`, `engine.quotas`, and `engine.automations.registerSource`. Beyond those checks the list is a statement to the user, not a sandbox: plugin code runs in the engine's process and the engine does not hold it to the list (see [Security](./security.md#permissions)). Declare what the plugin really does. A list that leaves something out misleads the people who install the plugin.

The engine records the list the user confirmed. An update that declares a permission the installed version did not have waits for the user's confirmation of the added ones.

## Icon

`icon` names one image file, relative to the package, that the app draws for the plugin. The rules:

- The extension is `.png`, `.webp` or `.svg`. The path follows the rules for one file, as `systemPrompt` does: inside the package, no `..`, no absolute path, no backslash.
- The file must exist, be a file and stay inside the package after symbolic links are resolved.
- It is at most 32 KB (32,768 bytes), and its bytes must be the type its extension names: a PNG or a WebP signature, or, for `.svg`, text whose root element is `<svg` (an XML declaration, a doctype and comments may come before it).
- The app draws it only as an image, so an SVG cannot follow the app theme or run script: draw a tile in a fixed colour. A plugin without an icon gets a monogram of its name.

```json
"icon": "assets/icon.svg"
```

The field is not a schema change: `schemaVersion` stays `1`. A bad icon file is a manifest error on the plugin's row; the plugin's resources still load. `manifest_check` returns the path as `icon` when the file is usable.

## SDK compatibility: `engines`

The host provides `@agz-yazilim/plugin-sdk` to extension code, and the SDK has a version (see [the extension API](./extension-api.md)). A plugin states which versions it works with in the `engines` field of its `package.json`, under the key `agz-plugin-sdk`, as a semver range:

```json
"engines": { "agz-plugin-sdk": "^1" }
```

This is an npm field at the top level of `package.json`, not an `agzPlugin` field: npm ignores `engines` keys it does not know, and `agzPlugin` stays a closed list. Without the key the range is `^1`.

The loader compares the range with the SDK version of the AGZ Code that runs, when it reads the manifest. A value that is not a semver range, or a range that the running SDK does not satisfy, is a manifest error: the plugin is not loaded and its row shows the reason. The range syntax is npm's (`^1`, `~1.2`, `>=1.1 <2`, `1.x`, `1.0.0 - 1.9.9`, `^1 || ^2`). `manifest_check` applies the same rule with the SDK version of its own release; `agz plugin check` of the plugin kit also compares the range with the SDK installed in the plugin folder.

## Explicit and conventional manifests

An explicit manifest is authoritative. A resource field that is omitted, or an empty array, declares no resources of that kind. A skill-only plugin does not run a stray `index.ts` and does not scan an undeclared `extensions` folder. An unknown field, a wrong type or an unsupported `schemaVersion` is an error; the loader never falls back to folder discovery or to another manifest. The old `package.json` `pi` field is not read. Add `schemaVersion` and `id` and move its lists into `agzPlugin`.

A package without an `agzPlugin` key uses folders at the package root, named after the resource types: `extensions`, `skills`, `prompts`, `themes` and `agents`. Everything inside a folder is picked up. A package that you want to publish should still have a manifest, because only the manifest is checked by `manifest_check` and described by this documentation.

## Agent definitions

A file listed in `agzPlugin.agents` is an agent profile. It is Markdown with a frontmatter block:

```md
---
name: reviewer
description: Reviews changes
base: worker
---
Review carefully.
```

| Field | Rule |
|---|---|
| `name` | Required. Must equal the file name without `.md`. Matches `^[a-z][a-z0-9-]{1,47}$`. It cannot be the id of a built-in agent. |
| `description` | Required. At most 160 characters. |
| `base` | Required. One of `explorer`, `researcher`, `worker`, `verifier`, `analyst` or `answer`. `answer` requires `exclusive: true`. |
| `exclusive` | Optional boolean. With `true`, only the owning package can run the profile, via [`ctx.agents.run`](./extension-api.md#run-a-package-agent). It appears in Settings > Agents, not in the subagent tool or workflows. |
| `tools` | Optional list. Use a subset of the base's tools and, if needed, the package's own named run tools (see below). |
| `steps` | Optional integer from 1 to 200. |
| `model`, `variant` | Optional non-empty strings. |

For a work base, the body is added to the base's prompt under Specialization. For `base: answer`, the non-empty body **is** the role text: the read-only agent gives one answer and never uses the model pool. Its default tools are `readJ`, `grepJ`, `globJ`, `memory_search`, `memory_read`, `skill_route` and `skill_load`. To narrow that set or use package-specific run tools, list the desired tools in the profile's `tools`; the package supplies those additional `<prefix>_<name>` tool definitions for each run. An answering profile defaults to 8 steps, with tools off on the last step so it can write its answer.

Any other field is an issue and the file is not used. If a package agent has the same id as a global agent, a project agent or an earlier package agent, it is skipped and the conflict is reported. Package agents from a project-scope plugin load only in a trusted project.

## Errors

The loader throws these messages. The part after the colon is the reason. `manifest_check` returns the reason alone, one per problem, and keeps going after the first.

Manifest errors start with `Invalid AGZ-Code plugin manifest in <path to package.json>: `. The reasons are:

| Reason | Cause |
|---|---|
| `package.json could not be read` | The file exists but cannot be read. |
| `package.json is not valid JSON` | The JSON does not parse. |
| `package.json must contain an object` | The top level is not an object. |
| `agzPlugin must be an object` | The key is not an object. |
| `unknown agzPlugin field <name>` | A field outside the table above. |
| `agzPlugin.schemaVersion must be 1` | A missing or different version. |
| `agzPlugin.id must be <publisher>/<name>, each part 1..63 lowercase letters, digits, '.', '_' or '-' (or a bare name of 1..128 such characters)` | A bad id. |
| `agzPlugin.<field> must be a non-empty string without control characters (at most 4096 characters)` | A bad `name`, `description`, `publisher` or `homepage`. |
| `agzPlugin.homepage must be an https URL` | The value is not a URL or not `https`. |
| `agzPlugin.homepage must be an https URL without credentials` | The URL has a user name or password. |
| `agzPlugin.<field> must be an array of at most 1000 package-relative paths` | A resource field that is not an array, or too long. |
| `agzPlugin.<field> must contain non-empty package-relative paths` | An entry that is not a string, is empty, has surrounding spaces, is too long, or has a control character or a backslash. |
| `agzPlugin.<field> path must stay inside the package: <entry>` | An absolute path, a drive path, an empty path after the prefix, or a `..` segment. |
| `agzPlugin.icon must be one package-relative png, webp or svg file path (at most 1024 characters, without backslashes or control characters)` | The icon is not a string, has another extension, or breaks the path rules above. |
| `agzPlugin.engine must be one package-relative ts, mts, js or mjs file path (at most 1024 characters, without backslashes or control characters)` | The engine module is not a string, has another extension, or breaks the path rules above. |
| `agzPlugin.mcpServers must map server names to server configs` | The value is not an object. |
| `agzPlugin.mcpServers holds at most 16 servers` | Too many servers. |
| `agzPlugin.mcpServers: <reason>` | A bad server name or config; the reason names the server, for example `invalid server name "<name>" (use letters, digits, "_" and "-")`. |
| `agzPlugin.permissions must be a list without repeats of: …` | The value is not an array, names an unknown permission or repeats one. |
| `agzPlugin.userContent[<n>].path must be project:<relative path> or home:<relative path>, without "..", backslashes or control characters` | A bad `userContent` path. |
| `agzPlugin.userContent[<n>].path repeats <path>` | Two entries name one place. |
| `agzPlugin.settings[<n>].scope must be "project" when given` | Another value of a setting's `scope`. |
| `agzPlugin.settings[<n>].scope is not allowed on a secret field` | A `secret` field with a `scope`. |
| `engines["agz-plugin-sdk"] must be a semver range, for example ^1: <value>` | The value is not a string or not a valid semver range. |
| `engines["agz-plugin-sdk"] <range> is not satisfied by the plugin SDK <version> of this AGZ-Code` | The SDK of the running AGZ Code is outside the range. |

Two more errors come from resolving the files:

| Reason | Cause |
|---|---|
| `agzPlugin.<field> path must stay inside the package (after resolving symlinks): <file>` | A symlink leads outside the package. |
| `agzPlugin.<field> declaration matches no resource files: <entry>` | A missing path, a glob without matches, or a folder with no files of that kind. |
| `agzPlugin.bots brief file is missing or unreadable: <path>`, `... path must stay inside the package (after resolving symlinks): <path>`, `... must be a file: <path>` | A bot template's `brief` has no file, leads outside the package or is a folder. |
| `agzPlugin.icon file is missing or unreadable: <path>`, `... path must stay inside the package (after resolving symlinks): <path>`, `... must be a file: <path>` | The `icon` has no file, leads outside the package or is a folder. |
| `agzPlugin.icon must be at most 32768 bytes: <path>`, `agzPlugin.icon is not a png image: <path>` (`webp` or `svg` likewise) | The icon is over 32 KB, or its content is not the image type of its extension. |
| `agzPlugin.engine file is missing or unreadable: <path>`, `... path must stay inside the package (after resolving symlinks): <path>`, `... must be a file: <path>` | The `engine` module has no file, leads outside the package or is a folder. |

The `systemPrompt` field has its own reasons, listed in [System prompt edits](#system-prompt-edits).

A package whose manifest does not load is reported as a load error in the plugin list and in the session's extension errors, and the engine's log. It does not fall back to anything, and it does not stop the other packages from loading: each package's error is its own.

## Desktop interface module

`agzPlugin.ui.module` takes `{ "entry": "dist/ui.mjs", "settings": true }`. Use `settings: true` only when the module provides a settings component. The package must declare the `ui` permission and include the single built ESM file (1 byte to 4 MiB) in `files`. Import the app's React and components from `@agz-yazilim/plugin-ui`. In a plugin with the kit installed, add the UI package and esbuild as development dependencies, then build `ui/index.tsx`:

```sh
npm install --save-dev --save-exact --ignore-scripts @agz-yazilim/plugin-ui@0.1.0 esbuild
npx agz plugin build-ui
```

The app uses the module's `views` for declared view ids, its `settings` component for custom settings, its `actions` for palette, optional menu and shortcuts, and its `badges` for right-panel views. Keep declarative views: Android and desktop devices that have not approved the exact module hash use those instead. Engine install approval is not device approval; an interface module has the rights of the app window.

## Native subprocesses

Declare named executables in `agzPlugin.binaries`. For example, `binaries: { "worker": { "linux-x64": { "path": "bin/linux-x64/worker", "sha256": "<64 lowercase hex digits>" } } }`. The package must declare `engine`, `process` and `native`, and ship each declared file. Installation verifies the hash of the engine platform's build; `engine.spawn` checks it again before starting it. Use `engine.hasBinary("worker")` to choose a fallback on a platform the package omits.

`engine.spawn({ binary: "worker", args, onOutput, restart: "on-failure" })` streams stdout, keeps stderr under the plugin's logs directory and stops the child when the plugin stops. It also accepts `command` instead of `binary` for external programs and passes arguments without a shell. `write` sends to stdin; `done` settles on the final exit. `spawn` leaves the wire format to the plugin. Ship your own executable; no Rust crate is required.

## Background helpers

An engine module with the `agents` permission can call `engine.registerHelper({ id, title, triggers, due, run })`. Use a lowercase local `id`, an English and Turkish `title`, and `triggers: { manual: true, intervalMs: 900000, events: ["handoff"] }` with only the triggers you need. The host prefixes the id with your plugin id and lists it in `helpers.list`. `due` is an optional admission check. `run({ reason, signal })` returns `{ outcome, changes?, summary? }`; honor the signal on disable or timeout.

The engine checks schedules every 15 minutes, backs off after failed automatic runs and keeps the last five outcomes in the plugin's data directory. The handoff signal carries no content, and a busy helper does not start another run. Use an interval as well if the helper needs to check its durable queue after a missed signal. Helpers are not bots and do not create a conversation by registering.

## Related pages

- [Quickstart](./quickstart.md): scaffold a package and check it.
- [The extension API](./extension-api.md): what `extensions` entries export.
- [Skill plugins](./skill-plugins.md): what a `skills` folder contains.
- [Storage](./storage.md): where the plugin, its settings and its data are kept.
