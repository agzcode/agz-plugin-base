# Contributing

## What has its source here

- `templates/`: `declarative`, `engine-module`, `mcp-server`, `project-settings`, `storage` and `view`
- `examples/`: `commit-style`, `date-tools`, `openai-compatible-provider`, `review-kit`, `snippets` and `uptime-monitor`
- `ci/`, `scripts/`, the README files and this file

Pull requests for these are welcome.

## What is a copy

- `docs/`
- `templates/extension`, `templates/skill`, `templates/skill-extension`
- `examples/command-guard`, `examples/issue-tracker`, `examples/release-notes`

Their source is the AGZ Code repository, which is not public. `scripts/sync-from-source.mjs` lists the public-release pages it does not overwrite. `synced.json` records a SHA-256 digest for every mirrored file, including these overrides. To correct a mirrored file, open an issue that names the file and the correction. Maintainers can update a public override here and retire it after the fix reaches the source.

A wrong sentence in the documentation is a defect like any other. Say what the page claims, what the app does instead, and how you saw it.

## Rules for a template or an example

- It installs with `npm install --ignore-scripts`, and `npm test` and `npx agz plugin check` pass in its folder. `node scripts/check-all.mjs <name>` runs the three.
- A template is the smallest plugin that shows one contribution point. Its names are `my-plugin`, `my_plugin`, `My Plugin` and `my-publisher`, so a copy can replace them.
- An example has a real use. Its tests check what the plugin does, including the failures: a bad setting, a limit, a missing file.
- Code, comments and in-product text are in English. A text the user sees in the app (`label`, `description`, `title`) has English and Turkish.
- No dependency unless the plugin cannot do without it. The SDK and the kit are `devDependencies` only: the host provides the SDK when the plugin runs.
- No secret in a default, a file or a URL. Say in the README which permissions the plugin declares and why.

## For maintainers

```sh
node scripts/sync-from-source.mjs            # copy from the AGZ Code checkout beside this repository
node scripts/sync-from-source.mjs --check    # compare non-overridden files with the source
node scripts/sync-from-source.mjs --record-overrides # update only public override hashes (no source checkout needed)
node scripts/sync-from-source.mjs --verify   # check all recorded hashes (also run by CI)
node scripts/check-all.mjs --tarballs <dir>  # try an SDK and a kit that are not published yet
```
