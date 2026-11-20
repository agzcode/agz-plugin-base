# Security

This page says what a plugin can reach and which protections the host applies. The host does not sandbox plugin code, so the protections below cover the steps around the code, not the code itself.

## What runs, and with which rights

A plugin's extension code runs in the engine process, with the engine's rights, in every session that loads it. Its tools, hooks and commands can read and write files, use the network, and start processes through `api.exec`, which runs a command without a shell. A plugin's engine module (`agzPlugin.engine`) runs in the same process with the same rights, once, for as long as the plugin is enabled, also while no session is open. Read a plugin's code before you install it.

## Permissions

A plugin can declare what it needs in `agzPlugin.permissions`; see the [full list in the manifest](./manifest.md#permissions).

The list is a statement, not a sandbox. The engine shows it and records what the user confirmed. Some host APIs require their declared permission, but the list does not restrict what the plugin's code can do. A plugin that declares only `network` can still read files and start programs, because its code runs with the engine's rights. The list tells the user what the author says the plugin does, and it makes a later change visible:

- When the app installs a plugin that declares permissions, the install waits after the download. The app shows the list in plain words, and the install goes on only when the user confirms. A cancel drops the downloaded copy.
- An update waits the same way, but only for the permissions the installed version was not confirmed with.
- A local folder is read in place, so its manifest can change at any time. When it declares a new permission, the plugin's card shows a note and the user confirms it there. The note informs; it does not stop the plugin from loading.
- The wait happens only when the client asks for it (`askPermissions` in the engine's API), as the app does. A client that does not ask, such as a script without a user, gets no wait: its install request is the confirmation.

## Plugin access

The standard access API is `@experimental`. Unlike the install-time permission list, `agzPlugin.access` opts the plugin into a gate the engine checks on every registered extension tool call. The optional manifest field is a list with no repeats. It must include `read` and can contain only these names:

| Name | Allows |
|---|---|
| `read` | Read the user's data. Required for every tool call. |
| `subagents` | Let subagents and workflow tasks call read and download tools. |
| `modify` | Change data with approval for each action. |
| `send` | Send data with approval for each action. |
| `delete` | Delete data with approval for each action. |
| `download` | Save downloaded files. |
| `automations` | Make event sources available to user-configured automations. |

Each declared name has a switch in Settings > Plugins > the plugin's settings > Access. All are off by default, and the UI requires Read to be on before the other switches can be changed. Add an optional `agzPlugin.accessNotes` object to explain what a declared switch does for this plugin: each key must be in `agzPlugin.access`, and each note must supply `en` and `tr` text, at most 500 characters per language. Do not declare `settings` keys beginning with `access_`: the engine reserves that prefix for [user-scope switches](./storage.md#access-switches).

The engine checks these conditions before running an opted-in tool:

- The project must be trusted, even for user-scope plugins. Read and every switch the tool declares must be on. Signing in to a service does not grant the agent access.
- A subagent or workflow task may use only read and download tools, and only while `access_subagents` is also on.
- Any tool that declares `modify`, `send` or `delete` needs a main session with an attached UI. In the tool, ask for [approval of the exact action](./extension-api.md#tool-access-and-approval) before making the change. Headless runs cannot do this.

For automation event sources, `agzPlugin.permissions` must still include `automations` for registration. The experimental access contract also requires both `access_read` and `access_automations` to be on for an opted-in plugin's sources to be listed and deliver events. This does not grant a workflow task permission to call the plugin's write tools.

The gate controls the agent's use of the plugin's registered extension tools. It is **not** a sandbox for the plugin's own code: hooks, commands and engine module code still run with the engine's rights. A download or a read is not a grant to send the same data to someone else. MCP tools use their own agent access rules below.

Treat fetched mail, messages, documents and other external content as untrusted data, not as instructions. Do not take a recipient or an action from instructions embedded in that content. Keep it separate from trusted instructions and show the user the actual destination and payload before any approved write.

## Plugin accounts

Account access is experimental. Declare `agzPlugin.accounts` with an id, `google` or `microsoft` provider and scopes, add `accounts` to `permissions`, and declare `access` including `read`. Signing in does not grant the agent access: the user must also enable Read. Sign-in can only be started on the engine's local machine. `reconnect_required` means the user must connect the account again.

The engine holds the token and the account API never returns it to plugin code. This API is not a sandbox for arbitrary plugin code, but every request is held to these rules, and a call that breaks one sends nothing:

- **The URL** is a string at an https API origin of the declared provider. A `Request` object in its place is refused, and so is plain `http`, a loopback address included: only the engine's own tests may point a provider at a local server.
- **The options** are one plain object, and only `method`, `headers` and `body` are copied into the request. Any other key, such as `dispatcher`, `signal` or `redirect`, and a `Request` or a class instance in place of the object, is refused. Do not set `Authorization`: the engine adds the account's token. `body` may be a string, `Uint8Array`, `ArrayBuffer` or `URLSearchParams`.
- **Redirects** come back to the tool without being followed, so the token never reaches another host, and a 401 triggers one refresh and one retry.
- **A read tool** sends GET or HEAD. Its only POSTs are Microsoft Graph's two read endpoints: `$batch`, whose JSON body must carry a non-empty `requests` list of GET sub-requests, and `search/query`, which must be POST. Every other non-GET/HEAD request from such a tool is refused.
- **A write tool** declares `modify`, `send` or `delete` and passes the approval ticket its own `ctx.access.approve()` returned in the same tool call. The engine checks that it issued that ticket to this call for that action: a ticket the plugin builds itself, or one from another tool call, is refused.
- **Subagents, workflow tasks and engine modules** send only GET or HEAD, Graph included.

Every fetch needs `access_read`.

## MCP tools and agent access

A plugin's MCP server runs with the rights of the rest of its code, but an agent calls its tools only when the user has granted that server to the agent. By default no agent reaches any MCP server, the lead included; a loaded skill can open a configured server for the main agent, with the user's approval. The user grants a server in Settings > Agents > Tools, and every call of an MCP tool or resource tool that the agent's grant does not cover is refused before it reaches the server. The [extension API page](./extension-api.md) gives the rule and the refusal text.

## Secrets

A setting of type `secret` is kept out of the plugin's ordinary settings. The engine stores it in `secrets.json` of the plugin store (`~/.agz-code/plugins/secrets.json`, readable by the user alone), apart from `auth.json`, which holds the provider keys. The app sees only that a secret is set and, for a value of four characters or more, its last four characters. The plugin's own extensions read their secrets through `getPluginSettings()`, which returns only that plugin's fields. That limit belongs to the API, not to the engine: a plugin's code runs with the engine's rights and the credential shield does not wrap it, so it can read `secrets.json` and `auth.json` directly. Any installed plugin can therefore read every other plugin's secrets and the provider keys. Install only plugins whose code you have read.

Ordinary settings are stored in the store's `config/<key>.json`. A plain uninstall keeps the plugin's settings and secrets for a later install; a removal with "Also delete its settings and data" ticked deletes them (see [Storage](./storage.md#what-an-uninstall-removes)). A project's own values of a plugin's settings live in the project folder and never hold a secret. Do not put a credential in a default, a file of the package or a URL. The issue-tracker example, for instance, refuses an endpoint with credentials in its URL, and sends its token as a bearer header.

## Installing and updating

- An npm package is installed with `npm install --ignore-scripts`, so its lifecycle scripts (`preinstall`, `install`, `postinstall`, and `prepare`) do not run. An install or update with `runScripts: true` runs them. A package whose scripts were skipped gets the row issue `scripts_not_run`, which names the packages.
- A git source is cloned and installed with the same flag, so the clone's `prepare` script does not run by default.
- Install and update need an explicit confirmation (`confirm: true` in the engine's API).
- The install and update confirmations warn that the plugin runs with the engine's rights and can read other plugins' secrets and provider keys. A plugin that declares permissions gets the second confirmation described under [Permissions](#permissions).
- A package is downloaded into a staging folder and becomes the installed version only when it is complete. An update never changes the installed folder: it adds the new version beside it.
- Two installed plugins never share an id. An install whose `agzPlugin.id` is already installed from another source is refused before the record or an installed version changes, so a package cannot take the place, the settings or the data of a plugin the user already has. The id is read from the downloaded package: the download into the staging folder, and its install scripts when you ticked them, have run by then.
- A local folder is not copied. The engine reads it in place, and it is the developer's own folder.

## Changed files after install

For an npm or git package that the engine installs or updates, it records the package version, npm's integrity value or the git commit, and a digest of the package's files. Each load checks the installed files against that record. A package whose files changed since then is not loaded, and its row says `changed_since_install`. A local folder is not checked: it is meant to change. The record does not stop someone who has the user's own rights, since they can rewrite it next to the files.

## Projects that are not trusted

A project names its plugins in `<project>/.agz-code/plugins.json`. That file, and the project's own setting values, take effect only when the user trusts the project. In an untrusted project, sessions do not load its plugins, and the list shows them read-only: changing them needs trust. Plugins of the user scope load whatever the project's trust. The project's file only names plugins: the packages are installed into the user's plugin store, with the same confirmation as any other install.

## The credential shield

The engine keeps its own credential files out of agents' reach. These are the provider keys, the MCP OAuth tokens, the engine's access tokens, the tokens of remote engines and the browser's saved passwords, and any paths the user lists in `shellHiddenPaths` in `agents.json`. The shield covers three things:

- `edit` and `write` refuse these paths on every OS, including through a symbolic link or a hard link.
- On Linux with bubblewrap (`bwrap`), each shell command runs with the existing credential files and folders masked. On other systems, or when bwrap is missing or blocked, the shell is not masked, and Settings shows why.
- The shield wraps the agent's `edit` and `write` tools and its shell commands. It does not wrap a plugin's extension code, which runs in the engine process.

Its limits:

- It hides the credential files from direct reads. It is not isolation: writes stay open, and other files stay readable on purpose, among them `~/.ssh`, `~/.git-credentials` and `~/.config/gh`.
- A command that needs its own user namespace, such as a nested `bwrap`, `unshare`, rootless podman or a Chromium sandbox, fails inside the wrapper.
- A skill's script that may write is not wrapped.
- The user's D-Bus session stays reachable, so a command can still reach the desktop keyring.
- The shield says nothing about the other tools; this page does not claim that they refuse credential files.
