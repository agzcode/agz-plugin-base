# Example plugins

The open repository `agzcode/agz-plugin-base` holds a template and a complete example for every kind of contribution. A template (`templates/<name>`) is the smallest plugin that uses one contribution point; copy its folder and rename `my-plugin`. An example (`examples/<name>`) is a finished plugin with a real use. Each has a manifest, its source, tests and a README.

## Templates

| Template | Contribution | Example of it |
|---|---|---|
| `extension` | A tool and a hook in extension code. `agz plugin create` writes it. | `command-guard` |
| `skill` | A skill with a script tool. `agz plugin create --kind skill` writes it. | `release-notes` |
| `skill-extension` | A skill and extension code together. `agz plugin create --kind skill+extension` writes it. | none |
| `view` | A panel view the app draws from data, and a decorated tool card (`ui.views`, `ui.toolViews`). | `issue-tracker` |
| `engine-module` | An engine module: code that runs once while the plugin is enabled (`engine`). | `uptime-monitor` |
| `mcp-server` | An MCP server declared in the manifest, without extension code (`mcpServers`). | `date-tools` |
| `project-settings` | A settings form with a project-scoped field (`settings`, `scope: "project"`). | `commit-style` |
| `storage` | The plugin's own data folder (`getPluginPaths()`). | `snippets` |
| `declarative` | No code: an agent, a prompt template, a bot template, a system prompt edit and an icon. | `review-kit`, `release-notes` |

The manifest's `themes` field has no template: the loader resolves theme files, but the desktop app does not apply them.

To start from a template, copy its folder and replace the four placeholder names everywhere in it, in the file contents and in the file names (`test/my-plugin.test.ts`). For a plugin `todo-notes` of the publisher `acme`:

| Placeholder | Becomes | Where it is used |
|---|---|---|
| `my-plugin` | `todo-notes` | The package name, the id's name part, file names |
| `my_plugin` | `todo_notes` | Tool names, such as `todo_notes_remember` |
| `My Plugin` | `Todo Notes` | The name the app shows, tool labels |
| `my-publisher` | `acme` | The id's publisher part, so the id is `acme/todo-notes` |

Then run `npm install --ignore-scripts`, `npm test` and `npx agz plugin check` in the folder.

Three of the examples, `issue-tracker`, `command-guard` and `release-notes`, also live in the kit's source, `packages/plugin-kit/examples`. The engine's tests load `issue-tracker` and `command-guard` into the mock host and into the real engine, and compare what they register and what they do. `release-notes` is a skill, so the engine's tests check it in the engine alone.

## Issue Tracker

Searches a GitHub-style issues API from the agent and shows the results in a panel. Folder: `examples/issue-tracker`.

- Manifest: id `issue-tracker`, one extension `src/index.ts`, and one panel view `issues`.
- Settings: `endpoint` (the issues URL, up to 500 characters), `token` (a secret, sent as a bearer token) and `pageSize` (1 to 100, default 20).
- Tool `issue_tracker_search`: optional `query` (title text, ignoring case), `state` (`open`, `closed` or `all`; default `open`) and `label`. It is read-only.
- A request times out after 15 seconds. Pull requests are left out of the list. An endpoint with credentials in its URL is refused, and no error message contains the token.
- The panel has a state filter. The plugin handles `settings_change` by invalidating its view, so the panel reloads after the user saves.

## Command Guard

Blocks dangerous shell commands before the agent runs them. Folder: `examples/command-guard`.

- Manifest: id `command-guard`, one extension `src/index.ts`, and four settings: `mode` (`block` or `warn`; default `block`), `disabledRules` (rule ids separated by commas), `extraPattern` (a regular expression matched case-insensitively against the whole command) and `shellTools` (default `bash`).
- It handles `tool_call` for the tools listed in `shellTools`. Runs of whitespace in the command count as one space.
- Six built-in rules: `rm-root`, `git-force-push`, `git-reset-hard`, `pipe-to-shell`, `disk-overwrite` and `chmod-777`. In `block` mode a match returns `{ block: true, reason }`; in `warn` mode the command runs and the user is notified.
- A bad setting (an unknown rule id, an invalid pattern) is ignored. The plugin warns about it when the set of problems changes, not on every command.
- The command `/guard-rules` sends the list of rules, with the ones turned off, to the session as a message.

## Release Notes

Drafts release notes from the commit subjects since the last tag. Folder: `examples/release-notes`. It has no extension code: its manifest declares a skill, a system prompt file and a bot template.

- Skill `skills/release-notes`, of kind `routed`, with trigger phrases in English and Turkish. It reads the subjects of `git log <tag>..HEAD` and passes them to `group_commits`, then edits the draft.
- Tool `group_commits`: input `subjects` (up to 2000 strings of at most 500 characters); output `markdown`, `sections` and `ignored`. It is not mutating and reads no file. It groups Conventional Commits into Added, Fixed, Changed, Documentation and Other, lists breaking changes first, and counts `chore`, `test`, `ci`, `build` and `style` commits as ignored. Its script is `skills/release-notes/scripts/group_commits.mjs`.
- System prompt file `system-prompt.json`: one `add` operation in the `working` section, id `release-notes.grounding`. It tells the agent to write only the changes it found in the history it read.
- Bot template `weekly-notes`, named `release-notes-bot`, with the brief `bots/weekly-notes.md`. Its suggested approval is `report`: it drafts the notes and reports them, and writes a file only when the user names one.

## Uptime Monitor

Checks a list of URLs in the background and tells the agent which ones are down. Folder: `examples/uptime-monitor`. It shows what an engine module is for: the checks run once for the whole engine, whether or not a session is open.

- Manifest: id `example/uptime-monitor`, the engine module `src/engine.ts`, one extension `src/index.ts`, the permission `network`, and three settings: `urls` (http or https addresses separated by commas or spaces, at most 20), `intervalSeconds` (30 to 86400, default 300) and `timeoutSeconds` (1 to 60, default 10).
- The engine module asks every URL at the interval, writes the result to `status.json` in the plugin's data folder and one line per round to `checks.log` in its logs folder. It checks again at once when the settings are saved, and a round asked for while one runs follows it instead of being dropped. It writes nothing after the engine's stop signal.
- Tool `uptime_status`: no input, read-only. It reads `status.json` and lists the URLs that are down first. It fails with what to do when no URL is configured or no check has finished.
- A URL with credentials is refused, and no log line or tool result prints one.
- The engine module and the extension code share no variables; `src/checks.ts` holds what both import, and the file in the data folder is where they meet.

## Date Tools

Calendar arithmetic as an MCP server. Folder: `examples/date-tools`. It has no extension code: the manifest declares the server.

- Manifest: id `example/date-tools`, one declared server `date-tools` (`node ${pluginDir}/server/index.mjs`) and the permission `process`.
- The server speaks MCP over stdio without a dependency. Its tools are `days_between` (`from`, `to`), `add_days` (`date`, `days`) and `weekday` (`date`), which an agent that was granted the server calls as `mcp__date_tools__days_between` and so on.
- Dates are `YYYY-MM-DD` calendar days counted in UTC, so a daylight saving change never moves a result. A date that is not a day of the calendar comes back as an error result with the reason.

## Commit Style

Checks a commit message against the rules of the project the session works in. Folder: `examples/commit-style`.

- Manifest: id `example/commit-style`, one extension `src/index.ts`, and four settings. `format` (`conventional` or `plain`), `types` and `maxSubjectLength` are project-scoped: a project keeps its own values in `<project>/.agz-code/plugin-config/example+commit-style.json`. `guardGitCommit` is a user setting.
- Tool `commit_style_check`: input `message`; it returns `ok`, the list of problems and the rules that applied. It is read-only.
- With `guardGitCommit` on, a `tool_call` hook refuses a `bash` call that runs `git commit` with a quoted `-m` value that breaks the rules. A message it cannot read without a shell passes.
- The code reads the settings on every use and never chooses between the project's value and the user's: `getPluginSettings()` returns the one that applies.

## Snippets

Keeps named texts for the agent across sessions and projects. Folder: `examples/snippets`.

- Manifest: id `example/snippets`, one extension `src/index.ts`.
- Tools `snippet_save`, `snippet_get`, `snippet_list` and `snippet_delete`. The store is one file per snippet under `snippets/` in the plugin's data folder (`getPluginPaths().data`).
- A snippet name is also a file name, so it is checked against a pattern that cannot leave the folder before a path is built. A snippet is written to a temporary file and renamed. One snippet holds at most 64 KB and the store at most 200 snippets.
- The tests run two sessions over one storage folder (`createMockHost({ storageDir })`) and read the files the plugin wrote.

## Review Kit

Code review without code. Folder: `examples/review-kit`.

- Manifest: id `example/review-kit`, the agents folder, the prompts folder, a system prompt file and an icon.
- Agents `review-kit-correctness` and `review-kit-tests`, both on the base agent `verifier`.
- Prompt templates `/review`, which sends a change to both agents and has the findings checked, and `/review-fix`, which fixes the confirmed ones.
- It has no test file: its `test` script is `agz plugin check`, which validates the manifest and every file it names.

## OpenAI-compatible model provider

In `examples/openai-compatible-provider`, an engine module adds chat models with `engine.providers.register`. It reads the endpoint and model list from its settings and gives the engine the name of its own secret field, not the API key itself. Try it against a local OpenAI-compatible test server before connecting a real account. The conversation goes to that server only when you select and use one of its models. Disabling the plugin removes those models.

## Run an example's tests

Each example's `test` script is `agz plugin test` (`agz plugin check` for `review-kit`). In the example's folder, run `npm install --ignore-scripts`, then `npm test` and `npx agz plugin check`. In a clone of `agz-plugin-base`, `node scripts/check-all.mjs` does this for every template and example. The tests use `createMockHost`, which is described in [Testing a plugin](./testing.md).
