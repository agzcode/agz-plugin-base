# Command line

The `agz plugin` command creates, checks, tests, packs and watches a plugin folder. It comes from `@agz-yazilim/plugin-kit`, which the templates list as a development dependency, so `npx agz plugin <command>` runs it inside the plugin folder. The template's `npm test` script runs `agz plugin test`.

Each command exits with 0 on success and a nonzero status on failure. `agz plugin --help` prints the usage. `--integration` belongs to `test`; `--engine` belongs to `test --integration` and `publish`.

## Commands

| Command | What it does |
|---|---|
| `agz plugin create <dir> [--kind extension\|skill\|skill+extension] [--id <publisher>/<name>]` | Creates a plugin from the template of its kind in a new or empty folder. `--id` gives the plugin id; without it the id is the folder's name. The default kind is `extension`. |
| `agz plugin check [dir] [--json]` | The manifest rules, the `engines["agz-plugin-sdk"]` range against the SDK installed in the folder, `tsc --noEmit` when there is a `tsconfig.json`, and the files `npm pack` would ship. |
| `agz plugin test [dir] [--json] [--integration [--engine <path>]]` | The engine range check, then `node --test` over the test files. With `--integration`, the installed app's engine loads the plugin too. |
| `agz plugin pack [dir]` | The check, then `npm pack --ignore-scripts`. Prints the tarball's path and its file count. |
| `agz plugin publish <spec.json> --out <payload> [--engine <path>]` | Prepares the [signed catalog release](./testing-packaging.md#signed-releases-in-the-public-catalog) document for signing. Prints the document and artifact digests. Offline; does not sign, upload, or publish. |
| `agz plugin dev [dir]` | Runs the check now and again after every change in the folder, until Ctrl+C. |
| `agz plugin build-ui [dir] [--source <file>]` | Builds the desktop UI module declared in `agzPlugin.ui.module.entry`. Defaults to `ui/index.tsx`. Requires `esbuild` in the plugin's dev dependencies. |

`[dir]` defaults to the current folder.

## Create a plugin

`create` copies the template of the chosen kind:

- `extension`: code only. `extensions/index.ts` holds a tool, a hook and the factory.
- `skill`: a skill folder, `skills/<id>`, with a script tool.
- `skill+extension`: both.

Give the plugin its id with `--id <publisher>/<name>`, for example `--id acme/notes-helper`: the manifest gets that id, and the file, skill and tool names are made from the name part (`notes_helper_echo`). Without `--id` the id is the folder's name, a bare id without a publisher; a plugin you publish should have a publisher (see [the manifest](./manifest.md#the-plugin-id)).

The `agz-plugin-base` repository has more templates, one for each kind of contribution (an engine module, a declared MCP server, project-scoped settings, the plugin's data folder, a view, a plugin without code); copy the folder of one instead of running `create`. They are listed in [Example plugins](./examples.md#templates).

`create` never overwrites a file: it refuses a folder that exists and is not empty. It then pins the versions of this kit and of the SDK it depends on in the new `devDependencies`, so the plugin is tested against the kit that created it. `npm install` in the new folder installs these versions from npm.

## Check a plugin

The check runs four steps:

1. `manifest`: the manifest rules the host applies (the same validator the plugin-dev skill's `manifest_check` runs).
2. `engines`: `engines["agz-plugin-sdk"]` (default `^1`) against the SDK installed in the folder. When the SDK is not installed yet, this is a warning, not an error.
3. `typecheck`: `tsc --noEmit -p tsconfig.json` with the folder's own TypeScript, when the folder has a `tsconfig.json`. Without `typescript` in the folder, this step fails.
4. `package`: runs only when the manifest is valid. It lists the files `npm pack` would ship and reports each file the manifest needs that the package lacks.

A passing run, here for a plugin of the `skill+extension` kind (the `extension` kind ships 3 files):

```text
agz plugin check: /home/me/notes-helper
  manifest    passed
  engines     passed  agz-plugin-sdk ^1 (installed 1.5.0)
  typecheck   passed
  package     passed (9 files)
check passed
```

Errors fail the check. Warnings are advice and do not. `--json` prints the same result as a report with `ok`, `steps`, `sdk`, `errors` and `warnings`, for scripts.

## Test a plugin

`test` runs the engine range check, then `node --test` over the files `*.test.ts`, `*.test.mjs` and `*.test.js` under the folder's `test/` (subfolders included, in name order). A plugin without a test file fails with `no test files`; a plugin that has no code to test, only files the manifest names, sets its `test` script to `agz plugin check` instead. `--json` prints the test output with the report.

## Pack a plugin

`pack` runs the check first. When the check fails, nothing is packed and the errors are printed. Otherwise it runs `npm pack --ignore-scripts` in the folder and prints the tarball's path and its file count. The tarball is written into the plugin folder.

## Watch while you develop

`dev` runs the check at once, then again 300 ms after the last change in the folder. It ignores changes under `node_modules` and under folders whose names start with a dot, such as `.git`. It stops on Ctrl+C.

It also prints how to link the folder. In AGZ Code, open Settings > Plugins and add the folder as a local path. From then on the app watches the folder: when a file changes, it reloads the sessions that loaded the plugin. Idle sessions reload soon after the change; a running session reloads when its run ends. The Reload sessions button in Settings > Plugins applies the change at once.

## Integration test

`agz plugin test --integration` runs the unit tests, then asks an engine to load the plugin:

```sh
npx agz plugin test --integration
npx agz plugin test --integration --engine /path/to/agz-engine
```

The engine is the `--engine` path, else the `AGZ_ENGINE` variable, else the first engine found in:

- Linux: `/opt/agz-code/resources/agz-engine`, then the engine an AppImage unpacked into `~/.cache/agz-code/engine/<version>/` (the newest version first; `XDG_CACHE_HOME` is honored).
- macOS: `/Applications/agz-code.app/Contents/Resources/agz-engine`.
- Windows: `%LOCALAPPDATA%\agz-code\resources\agz-engine.exe`.

When no engine is found, `test --integration` fails before the unit tests run and lists the paths it looked at. An engine that predates the `plugin-check` command is refused with a request to update the app.

The engine loads the folder as a local-path package into a temporary agent directory. There is no session, no model, no network and no server. It reports what the plugin registered (tools, commands, views, settings, skills and prompts) and every issue. It also reports the MCP servers, each with its transport and whether the manifest declared it or code registered it, and the engine module: the engine imports the module and reports an error when its default export is not a function. The factory is not called, so no background work starts. The integration passes when the engine exits with 0, which means no issue has the level `error`.
