# My Plugin

A plugin for AGZ Code that keeps its own data between sessions, in the folder the host gives it.

- `package.json`: the `agzPlugin` manifest declares `extensions/index.ts`.
- `extensions/index.ts`: registers `my_plugin_remember` and `my_plugin_recall`, which keep texts in `items.json` of the plugin's data folder (`agz.getPluginPaths().data`).
- `test/my-plugin.test.ts`: two sessions over one storage folder, with the kit's mock host (`storageDir`).

Run `npm install`, then `npm test` and `npx agz plugin check`. Link this folder in Settings > Plugins as a local path.

## The plugin's folders

`getPluginPaths()` returns four absolute paths. For this plugin they are, in the plugin store `~/.agz-code/plugins/`:

| Folder | Path | Use |
|---|---|---|
| `data` | `data/my-publisher+my-plugin/` | Lasting state. It survives updates and a plain uninstall. |
| `cache` | `cache/my-publisher+my-plugin/` | What can be built again. It may be deleted at any time. |
| `logs` | `logs/my-publisher+my-plugin/` | Log files. |
| `package` | the installed package | Read only: it is replaced on every update. |

Use these instead of a path of your own. Every session of the plugin shares them, so write a file in one step, as `write` does here. Keep the user's own work out of them: put it where the user chose and declare the place in `agzPlugin.userContent`.
