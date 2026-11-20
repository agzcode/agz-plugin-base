# Compatibility

A plugin declares the SDK versions it works with, and the host checks that declaration when it loads the plugin. This page covers the range, the SDK and the kit in a plugin, and what happens on a mismatch.

## The SDK range

`engines["agz-plugin-sdk"]` in `package.json` is a semver range, for example `^1`. The field is optional: without it the range is `^1`. A value that is not a semver range is a manifest error.

The host compares the range with its own SDK version. A plugin whose range the host does not satisfy is not loaded, and its row in Settings > Plugins shows the issue `sdk_range` with the reason.

Name the lowest SDK version that has what the plugin uses. The engine module, declared MCP servers, project-scoped settings, `permissions`, `userContent` and `getPluginPaths()` came with SDK 1.1.0, so a plugin that uses one of them declares `^1.1.0`: an older app then says that it cannot load the plugin, instead of loading it without that part. Status bar views (`place: "statusbar"`, the engine module's `registerView` and `host`), the `stat`, `chart` and `ring` blocks, closed sections, a table column's `align` the plugin channel (`handle`, `publish`, `onSubscribers`), `engine.notify`, `engine.quotas` and the permission `usage` came with SDK 1.2.0. The `session_compaction_state` hook (a plugin's state lines in the compaction summary) and the `session_compact` hook came with SDK 1.3.0.

## The unstable entry point

A new surface is published first in `@agz-yazilim/plugin-sdk/unstable`. What is exported there may still change in a minor version of the SDK; it moves to the main entry point once a published plugin or an example of the `agz-plugin-base` repository works with it. Today it holds the engine module's types: `PluginEngineFactory`, `PluginEngineAPI`, `PluginEngineHost` and `PluginEngineStats`. Import them with `import type`, and expect to follow a change when you raise the SDK version.

## The SDK and the kit in a plugin

- `@agz-yazilim/plugin-sdk` (the types, and a small runtime that exports `SDK_VERSION`) and `@agz-yazilim/plugin-kit` go under `devDependencies`. The templates pin both.
- The host supplies `@agz-yazilim/plugin-sdk` and `typebox` to extension code when it runs the plugin, so a plugin does not bundle them.
- Both packages are on the npm registry under the MIT license; the quickstart shows the install.
- A new plugin gets the versions of the kit that created it, so its tests run against that kit.

## What a mismatch does

| Where | Result |
|---|---|
| `engines["agz-plugin-sdk"]` is not a semver range | `agz plugin check` fails with `must be a semver range`. The host does not load the plugin. |
| The installed SDK does not satisfy the range | `agz plugin check` and `agz plugin test` fail with `does not satisfy`. |
| The SDK is not installed in the folder | `check` warns that the range was not checked, and asks for `npm install`. |
| The host's SDK does not satisfy the range | The plugin is not loaded. Its row shows `sdk_range`. |

`agz plugin test --integration` gets the host's verdict from the engine's `plugin-check` report: its `sdk` field gives the engine's SDK version, the plugin's range and `ok`, which is `false` when the engine refuses the range.
