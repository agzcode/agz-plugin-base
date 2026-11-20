# My Plugin

A plugin for AGZ Code with an engine module: code the engine loads once while the plugin is enabled, not once per session. Use it for background work that all sessions share.

- `package.json`: the `agzPlugin` manifest declares the engine module (`engine`), the extension code (`extensions`) and one setting.
- `engine/index.ts`: the engine module. It writes a heartbeat into the plugin's data folder at an interval, follows the interval setting and stops when the engine asks.
- `extensions/index.ts`: registers the tool `my_plugin_status`, which reads the heartbeat (callable as `tools.my_plugin_status({})` from Code Mode).
- `shared.ts`: the file name and the shape the two parts agree on. They are loaded apart and share no variables.
- `test/my-plugin.test.ts`: runs the engine module with a hand-made engine API and the tool with the kit's mock host.

Run `npm install`, then `npm test` and `npx agz plugin check`. Link this folder in Settings > Plugins as a local path. Only a plugin of the user scope has an engine module; a project plugin's `engine` is not loaded.

The engine API types come from `@agz-yazilim/plugin-sdk/unstable`: they may still change in a minor version of the SDK.
