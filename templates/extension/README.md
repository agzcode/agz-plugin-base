# My Plugin

An extension plugin for AGZ Code: executable code that registers one Code Mode tool and one hook through the host-provided `@agz-yazilim/plugin-sdk`.

- `package.json`: the `agzPlugin` manifest declares `extensions/index.ts`.
- `extensions/index.ts`: registers the tool `my_plugin_echo` (callable as `tools.my_plugin_echo({text})` from Code Mode) and a `tool_call` hook that refuses an empty echo.
- `test/my-plugin.test.ts`: tests the tool with the kit's mock host; `npm test` runs it with `agz plugin test`.

Run `npm install`, then `npx agz plugin check`. The host provides `@agz-yazilim/plugin-sdk` when the plugin runs; the folder lists it only as a devDependency for types and tests. Link this folder in Settings > Plugins as a local path, then reload sessions.
