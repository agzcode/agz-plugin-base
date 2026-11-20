# Issue Tracker

An AGZ Code plugin that lets the agent search the project's issues and shows them in a panel. It talks to any GitHub-style issues API (`GET <url>?state=&per_page=&labels=`, answering a JSON list with `number`, `title`, `state`, `html_url`, `user.login` and `labels`). Pull requests in the list are skipped.

It shows how to combine:

- a tool with a TypeBox schema (`issue_tracker_search`, `src/index.ts`) that reads its settings on every call;
- a **secret** setting (`token`, sent as a bearer token and never repeated in a result or an error) next to a plain string setting (`endpoint`) and a number setting (`pageSize`);
- a panel view (`issues`, `src/view.ts`) with a filter form and a table, declared in `agzPlugin.ui.views`, which renders again when the settings change.

## Use

Link the folder in Settings > Plugins as a local path, open the plugin's settings and fill in the issues API URL, for example `https://api.github.com/repos/OWNER/REPO/issues`, and, for a private repository, the access token. Then ask the agent about the project's issues, or open the Issues panel.

## Develop

```sh
npm install
npm test          # agz plugin test: the mock host with a stubbed fetch, no network
npx agz plugin check
```

The tests (`test/issue-tracker.test.ts`) replace `fetch` and run the tool and the view through `createMockHost` from `@agz-yazilim/plugin-kit/testing`.

The plugin uses only the public `@agz-yazilim/plugin-sdk` 1.x contract (`engines["agz-plugin-sdk"]` is `^1`). The code runs in the engine process with the engine's rights: it can reach whatever network address the settings name.
