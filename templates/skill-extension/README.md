# My Plugin

A plugin for AGZ Code with both parts: a skill with a script tool, and an extension that registers a Code Mode tool and a hook through the host-provided `@agz-yazilim/plugin-sdk`.

- `package.json`: the `agzPlugin` manifest declares the skill folder and `extensions/index.ts`.
- `skills/my-plugin/`: the skill (`SKILL.md`, `tools/count_words.json`, `scripts/count_words.mjs`, `examples/`). Its tool is `tools.skill__my_plugin__count_words(...)` in Code Mode.
- `extensions/index.ts`: registers `my_plugin_echo` (`tools.my_plugin_echo({text})`) and a `tool_call` hook that refuses an empty echo.
- `test/my-plugin.test.ts`: tests the tool with the kit's mock host and the skill's script; `npm test` runs them with `agz plugin test`.

Run `npm install`, then `npx agz plugin check`. The host provides `@agz-yazilim/plugin-sdk` when the plugin runs; the folder lists it only as a devDependency for types and tests. Link this folder in Settings > Plugins as a local path, then reload sessions.
