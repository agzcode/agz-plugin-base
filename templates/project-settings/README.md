# My Plugin

A plugin for AGZ Code with a settings form: one ordinary field and one project-scoped field, which a project can set for itself.

- `package.json`: `agzPlugin.settings` declares `testCommand` with `"scope": "project"` and `verbose` without a scope.
- `extensions/index.ts`: registers the tool `my_plugin_test_command`, which reads both with `getPluginSettings()`.
- `test/my-plugin.test.ts`: tests the default, a saved value and a change while the session runs, with the kit's mock host.

Run `npm install`, then `npm test` and `npx agz plugin check`. Link this folder in Settings > Plugins as a local path.

## Where the values are

The user's values are in the plugin store, `~/.agz-code/plugins/config/my-publisher+my-plugin.json`. A project's own value of a project-scoped field is in the project, `<project>/.agz-code/plugin-config/my-publisher+my-plugin.json`:

```json
{ "version": 1, "values": { "testCommand": "make check" } }
```

The engine reads the project's file only in a trusted project, and its value wins over the user's in that project's sessions. `getPluginSettings()` returns the value that applies, so the code does not choose. A `secret` field cannot be project-scoped.
