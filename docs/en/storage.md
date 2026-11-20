# Storage

This page says where AGZ Code keeps installed plugins, their settings and their own files, what a plugin may write and where, and what an uninstall removes. Every path below is the one the engine uses.

## The plugin store

Everything the engine keeps about plugins is in one folder, the plugin store: `~/.agz-code/plugins/`. It sits beside the agent directory `~/.agz-code/agent/`; when the agent directory is somewhere else, the store is the `plugins` folder beside it.

| Path in the store | Contents |
|---|---|
| `registry.json` | The one record of what is installed. |
| `packages/<key>/<version>/` | An installed version of a plugin. It is never edited in place. |
| `staging/` | Downloads and unpacked packages before they move into `packages/`. The engine empties it when it starts, unless it could not read `registry.json`. |
| `config/<key>.json` | A plugin's setting values (user scope). |
| `secrets.json` | The secret setting values of every plugin. |
| `data/<key>/` | A plugin's own lasting state. |
| `cache/<key>/` | What a plugin can build again. It may be deleted at any time. |
| `logs/<key>/` | A plugin's log files. |
| `catalog/` | The cache of the plugin catalog service. |

A project keeps two things of its own, in its `.agz-code` folder:

| Path in the project | Contents |
|---|---|
| `<project>/.agz-code/plugins.json` | The plugins the project wants. |
| `<project>/.agz-code/plugin-config/<key>.json` | The project's own values of a plugin's project-scoped settings. |

An npm or git package is always in the store, never in the project. A local folder stays where it is; the store only records it.

## Keys

A plugin id is `<publisher>/<name>`, for example `acme/notes`. On disk the id becomes its key: the `/` is written as `+`, a character an id cannot hold. So `acme/notes` has the key `acme+notes`, its settings are in `config/acme+notes.json` and its data in `data/acme+notes/`. A bare id without a publisher, such as `notes`, is its own key.

## The registry

`registry.json` lists every installed plugin by id:

```json
{
	"version": 1,
	"plugins": {
		"acme/notes": {
			"source": { "kind": "npm", "spec": "npm:@acme/agz-notes" },
			"scope": "user",
			"version": "1.2.0",
			"entry": "npm/node_modules/@acme/agz-notes",
			"enabled": true,
			"installedAt": 1763400000000,
			"previousVersion": "1.1.0",
			"integrity": { "digest": "sha256:...", "integrity": "sha512-...", "scriptsRun": false },
			"permissions": ["network"]
		}
	}
}
```

| Field | Meaning |
|---|---|
| `source` | Where the plugin came from. `kind` is `npm`, `git`, `https`, `local`, `feed` (AGZ's signed update feed) or `bundled` (shipped inside the app); `spec` is the source as it was given, or the folder's absolute path for `local`. |
| `scope` | `user`: loads in every session while `enabled`. `project`: loads only in a trusted project whose `plugins.json` names it. |
| `version` | The folder under `packages/<key>/` that the engine loads. Empty for a `local` plugin, which has none. |
| `entry` | The package root inside the version folder. |
| `enabled` | Whether sessions load the plugin. |
| `preinstalled` | `true` for a plugin that came with the app. It can be turned off, not uninstalled. |
| `installedAt` | The time of the install or the last update, in milliseconds since 1970. |
| `previousVersion` | The version folder kept for a rollback. |
| `integrity` | The digest of the package's files, npm's integrity value or the git commit, and whether the install ran lifecycle scripts. |
| `permissions` | The permissions the user confirmed at the install or the last update. |

The engine replaces the file in one step, under a lock on the file itself. A file that does not read as a registry is never overwritten: the engine reports it and you fix it by hand. A file written by a newer AGZ Code is read, but not changed. Do not edit the file while the engine runs; use Settings > Plugins.

## Installed versions

An npm or git install is first written into a fresh folder under `staging/`. When it is complete, the folder is renamed to `packages/<key>/<version>/` and the record is written. The folder's name is the package version, with the first seven characters of the commit after it for a git source (`1.2.0-3f9a1c2`), and with `+r2`, `+r3` and so on when that name is taken. A package without a usable version gets `0.0.0`.

An update does not touch the installed folder. It stages the new version beside it, switches the record and keeps the old folder as `previousVersion`. Open sessions may still read a replaced folder, so the engine deletes the folders that no record names only when it starts, and not at all while it cannot read `registry.json` or the file was written by a newer version.

A local folder is not copied. Its record names the folder, has no version, and the engine reads the folder in place. That is why a change in the folder reaches the next session load without an install.

## Settings and secrets

The values the user saves for a plugin's `settings` fields are in `config/<key>.json`:

```json
{ "version": 1, "values": { "endpoint": "https://api.example.com", "pageSize": 20 } }
```

Secret fields are not in that file. Every plugin's secrets are in the store's `secrets.json`, apart from the provider keys of `auth.json`:

```json
{ "version": 1, "secrets": { "acme/notes": { "apiToken": "..." } } }
```

Both files are readable by the user alone (mode 0600), and a plugin reads its own values through `getPluginSettings()`. The file permissions do not separate plugins from each other; see [Security](./security.md#secrets).

A field declared with `scope: "project"` can also have a value of the project. It is in `<project>/.agz-code/plugin-config/<key>.json`, in the same shape as the user's file, and it wins over the user's value in that project's sessions. The engine reads it only in a trusted project. The user sets it in the plugin's settings page, in the section "For this project" (the project chosen on the Plugins page); "Use my values" there deletes the project's values. A secret field cannot be project-scoped, so no secret is ever written into a project.

### Access switches

For a plugin that declares [standard access](./security.md#plugin-access), the experimental `access_<name>` switches are booleans in the plugin's user settings file. Missing means off. The engine never reads them from project settings. Declared switches appear in `getPluginSettings()`; ordinary `plugins.settings.update` requests preserve them. Do not edit the keys directly from plugin code.

Clients use the experimental `plugin_access` protocol capability:

- `plugins.access.get` takes `{ pluginKey }` and returns `{ access, revision }`. The `access` list contains `{ name, enabled, note? }` entries in manifest order. The revision is for the user settings file and is `null` if there is no file yet.
- `plugins.access.set` takes `{ pluginKey, name, enabled, baseRevision? }` and changes one declared switch, leaving all other values alone. When `baseRevision` is supplied and stale, it returns a `conflict` error with `data.revision`. Read the state again before applying the change. On success it returns the updated state and the engine notifies extensions with `settings_change`.

## Plugin folders

A plugin asks for its folders instead of choosing paths of its own:

```ts
const paths = agz.getPluginPaths();
// paths.data, paths.cache, paths.logs, paths.package
```

| Folder | Path | Use |
|---|---|---|
| `data` | `data/<key>/` in the store | Lasting state: a database, an index, saved results. It survives updates and a plain uninstall. |
| `cache` | `cache/<key>/` in the store | What can be built again. The user or the engine may delete it at any time. |
| `logs` | `logs/<key>/` in the store | Log files of the plugin and of the processes it starts. |
| `package` | The package root inside the installed version folder, or the developer's folder of a local plugin | The plugin's own files. Read only: it is replaced by another folder on every update. |

`data`, `cache` and `logs` exist when the call returns (mode 0700). An engine module gets the same folders as `engine.paths`. `getPluginPaths()` throws for a package without a manifest id.

Keep the user's own work, such as documents the user asked the plugin to make, out of these folders: put it where the user chose, and declare the place in `userContent` (see [the manifest](./manifest.md#user-content)).

## Project plugins

`<project>/.agz-code/plugins.json` names the plugins of a project by id:

```json
{
	"version": 1,
	"plugins": {
		"acme/notes": { "source": "npm:@acme/agz-notes" },
		"acme/lint": { "enabled": false }
	}
}
```

- An entry makes a plugin of the `project` scope load in this project. `source` says where to install it from on a machine whose store does not hold it yet: the plugin list of the project then shows it as not installed.
- `enabled: false` keeps a plugin out of this project's sessions, also a plugin of the user scope.
- The file takes effect only in a trusted project. In an untrusted project the plugin list still shows its entries, read-only, and no session loads them.
- It travels with the repository, so everyone who works on the project gets the same list.

## What an uninstall removes

Removing a plugin in Settings > Plugins asks one question: the box "Also delete its settings and data".

| | Remove | Remove with the box ticked |
|---|---|---|
| The record in `registry.json` | Deleted | Deleted |
| `packages/<key>/` | Deleted (a local folder is only forgotten) | Deleted (a local folder is only forgotten) |
| `config/<key>.json` and the plugin's secrets | Kept | Deleted |
| `data/<key>/`, `cache/<key>/`, `logs/<key>/` | Kept | Deleted |
| The places listed in `userContent`, outside the folders above | Kept | Kept |
| `<project>/.agz-code/plugin-config/<key>.json` | Kept | Kept |

What a plain uninstall keeps is used again when the plugin is installed again. The card "Data of removed plugins" at the bottom of Settings > Plugins lists what removed plugins left in the store, with its size, and deletes it from there.

Removing a project plugin from one project only takes it off that project's list while another trusted project still names it: the record, the package and the data stay. It leaves the store when the last such project removes it. A plugin that came with the app cannot be uninstalled, only turned off.

## Moving to another computer

The engine's `data-archive` command (see [Installation](./install.md#moving-the-data-to-another-computer)) takes `registry.json`, `config/` and `data/` of the store. It leaves out `packages/`, `staging/`, `cache/`, `logs/` and `catalog/`, and inside `data/` every `node_modules` folder, every `*.tmp` and `*.db-shm` file and everything that is not a plain file or folder. `secrets.json` is a credential file, so it comes only with `--with-credentials`.

After the import the record names every plugin, but the packages are not there: install them again from their recorded sources with Update in Settings > Plugins. A plugin that was read from a local folder still names the path of the old computer. A project's own files (`plugins.json` and `plugin-config/`) are not in the archive; they travel with the project's repository.

## Coming from an earlier version

Earlier versions kept plugin state in several places. The engine moves it into the store once: the user's own and that of the trusted projects it knows when it starts, that of another project when its plugins are first listed.

| Earlier place | Now |
|---|---|
| `pluginSettings` in `agz.json` | `config/<key>.json` |
| `plugin:<id>:<key>` entries in `auth.json` | `secrets.json` |
| The `packages` list in `agz.json` and in a project's `.agz-code/settings.json` | Records in `registry.json`, and the project's `plugins.json` |
| `npm/` and `git/` under the agent directory | `packages/<key>/<version>/` |

What the move takes out of the settings files is kept as a copy under `~/.agz-code/agent/agz/settings-backup/plugin-store/`. A local folder stays where it is.
