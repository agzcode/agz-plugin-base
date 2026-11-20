# Snippets

An AGZ Code plugin that keeps named texts for the agent across sessions and projects: a pull request template, a checklist, a command that is hard to remember. It shows how a plugin keeps its own data: in the folder the host gives it, not in a path of its own.

- `src/index.ts`: registers `snippet_save`, `snippet_get`, `snippet_list` and `snippet_delete`.
- `src/store.ts`: the store, one file per snippet under `snippets/` in the plugin's data folder.

## Where the data is

`agz.getPluginPaths().data` is `~/.agz-code/plugins/data/example+snippets/`: the plugin's id with `/` written as `+`. The folder is shared by every session and every project, survives updates and a plain uninstall, and is deleted only when the user removes the plugin with "Also delete its settings and data" ticked.

Three things in `store.ts` follow from writing files that the model names and several sessions share:

- A snippet name is also a file name, so it is checked against a pattern that cannot leave the folder before any path is built.
- A snippet is written to a temporary file and renamed, so a session never reads half a text.
- There is a limit on the size of one snippet and on their number, so a loop in a session cannot fill the disk.

## Develop

```sh
npm install
npm test          # agz plugin test
npx agz plugin check
```

The tests run two sessions over one storage folder with the kit's mock host (`createMockHost({ storageDir })`) and look at the files the plugin wrote.
