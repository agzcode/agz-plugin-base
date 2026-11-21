# agz-plugin-base

Write a plugin for [AGZ Code](https://code.agzyazilim.com) with the documentation, templates, examples, and CI workflow in this repository.

This is the open, MIT-licensed plugin development repository. AGZ Code and AGZ's own plugin source repositories are private. You can publish your own plugin's source or keep it private.

Türkçe: [README.tr.md](./README.tr.md)

## Your first plugin

You need Node.js 22.19 or newer and the AGZ Code desktop app.

```sh
mkdir my-work && cd my-work
npm init -y
npm install --save-dev --save-exact --ignore-scripts @agz-yazilim/plugin-kit@1.5.0
npx agz plugin create notes-helper --id acme/notes-helper
cd notes-helper
npm install --ignore-scripts
npm test
npx agz plugin check
```

Then open Settings > Plugins in the app, install the `notes-helper` folder as a local folder, press Reload sessions, and call the tool `notes_helper_echo` from a session. The [quickstart](./docs/en/quickstart.md) walks through each step.

## What a plugin can add

| Contribution | Manifest field or API | Template | Example |
|---|---|---|---|
| A tool, a hook, a slash command | `extensions` | [`extension`](./templates/extension) | [`command-guard`](./examples/command-guard) |
| A skill with script tools | `skills` | [`skill`](./templates/skill), [`skill-extension`](./templates/skill-extension) | [`release-notes`](./examples/release-notes) |
| A panel or sidebar view, a decorated tool card | `ui.views`, `ui.toolViews` | [`view`](./templates/view) | [`issue-tracker`](./examples/issue-tracker) |
| Background work that runs once for the whole engine | `engine` | [`engine-module`](./templates/engine-module) | [`uptime-monitor`](./examples/uptime-monitor) |
| An MCP server, without extension code | `mcpServers` | [`mcp-server`](./templates/mcp-server) | [`date-tools`](./examples/date-tools) |
| Settings, also per project | `settings`, `scope: "project"` | [`project-settings`](./templates/project-settings) | [`commit-style`](./examples/commit-style) |
| Its own data between sessions | `getPluginPaths()` | [`storage`](./templates/storage) | [`snippets`](./examples/snippets) |
| Agents, prompt templates, bot templates, system prompt edits, an icon | `agents`, `prompts`, `bots`, `systemPrompt`, `icon` | [`declarative`](./templates/declarative) | [`review-kit`](./examples/review-kit), [`release-notes`](./examples/release-notes) |

A template is the smallest plugin that uses one contribution point. To start from one, copy its folder, replace the placeholder names `my-plugin`, `my_plugin`, `My Plugin` and `my-publisher` in the file contents and file names (the table in [Example plugins](./docs/en/examples.md#templates) shows what each becomes), then run `npm install --ignore-scripts`, `npm test` and `npx agz plugin check` in it. An example is a finished plugin with a real use; read it to see how the pieces fit, including the cases a template leaves out (bad settings, limits, concurrent sessions).

## Documentation

English is in [`docs/en`](./docs/en), Turkish in [`docs/tr`](./docs/tr). The same pages are on the website: [code.agzyazilim.com/en/plugins/develop](https://code.agzyazilim.com/en/plugins/develop/).

| Start here | |
|---|---|
| [Overview](./docs/en/overview.md) | What a plugin is and what it can add |
| [Quickstart](./docs/en/quickstart.md) | Create, test, link and call a plugin |
| [The manifest](./docs/en/manifest.md) | Every `agzPlugin` field, rule and error |
| [Extension API](./docs/en/extension-api.md) | Tools, hooks, commands, MCP servers, settings, folders, views |
| [API reference](./docs/en/api-reference.md) | Every type of the SDK, generated from its source |
| [Storage](./docs/en/storage.md) | Where plugins, settings, secrets and a plugin's data live |
| [Security](./docs/en/security.md) | What a plugin can reach, permissions, secrets, trust |
| [Command line](./docs/en/cli.md) | `agz plugin create`, `check`, `test`, `pack`, `dev` |
| [Testing](./docs/en/testing.md) | Unit tests with the kit's mock host |
| [Compatibility](./docs/en/compatibility.md) | The SDK range and versions |
| [Develop from GitHub](./docs/en/github.md) | Install from a repository, publish a tag |
| [Example plugins](./docs/en/examples.md) | The templates and examples of this repository |

`docs/docs.json` lists every page in reading order.

## CI for your plugin

[`ci/plugin-ci.yml`](./ci/plugin-ci.yml) is a GitHub Actions workflow for a plugin's own repository: it installs without lifecycle scripts, runs the tests and the check, and uploads the packed tarball. Copy it to `.github/workflows/ci.yml` in your repository.

## Versions

The templates and examples use npm releases [`@agz-yazilim/plugin-sdk@1.5.0`](https://www.npmjs.com/package/@agz-yazilim/plugin-sdk/v/1.5.0) and [`@agz-yazilim/plugin-kit@1.5.0`](https://www.npmjs.com/package/@agz-yazilim/plugin-kit/v/1.5.0). For desktop interface modules, use [`@agz-yazilim/plugin-ui@0.1.0`](https://www.npmjs.com/package/@agz-yazilim/plugin-ui/v/0.1.0). All three are MIT licensed. The host's SDK must satisfy the plugin's `engines["agz-plugin-sdk"]` range; see [Compatibility](./docs/en/compatibility.md).

SDK 1.4.0 adds tools limited to the main session (`scope: "main"`), package agent runs with [`ctx.agents.run`](./docs/en/extension-api.md#run-a-package-agent), exclusive and answer-only package agent profiles ([agent definitions](./docs/en/manifest.md#agent-definitions)) and agent-style tool cards (`card: "agent"`, sections with `as: "markdown"`). Kit 1.4.0's mock host simulates agent runs: give `createMockHost` an `agents` responder and read the validated calls from `host.agentRuns`. A plugin that uses one of these declares `^1.4.0`.

The [overview](./docs/en/overview.md#engine-and-desktop-contributions) also covers desktop UI modules, status bar views, native subprocesses, background helpers, model providers and notifications. [Publishing to the catalog](./docs/en/testing-packaging.md#signed-releases-in-the-public-catalog) requires operator approval; publishing a package on npm or Git does not list it in the catalog.

## Working on this repository

```sh
node scripts/check-all.mjs              # install, test and check every template and example
node scripts/check-all.mjs snippets     # only one
node scripts/sync-from-source.mjs --verify   # the copied files are as they were synced
```

The docs, three kit templates and three kit examples mirror AGZ Code, with local overrides for the public release. `synced.json` records their hashes. No private checkout is needed to develop plugins or run the checks above. See [CONTRIBUTING.md](./CONTRIBUTING.md) for how to propose changes.

## License

MIT. See [LICENSE](./LICENSE).
