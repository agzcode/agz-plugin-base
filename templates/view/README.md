# My Plugin

A plugin for AGZ Code with its own user interface: a panel view and a decorated tool card. The app draws both from data; no plugin code runs in the app's window.

- `package.json`: `agzPlugin.ui.views` declares the panel `tasks`, and `agzPlugin.ui.toolViews` decorates the card of the tool `my_plugin_add_task`.
- `extensions/index.ts`: registers the tool and the view. `render` returns the view as sections of blocks (a form, a table, buttons); `action` runs what a form or a button named.
- `test/my-plugin.test.ts`: renders the view and runs its actions with the kit's mock host, which checks the view the way the host does.

Run `npm install`, then `npm test` and `npx agz plugin check`. Link this folder in Settings > Plugins as a local path; the panel is in the session's right panel.

A view's `place` is `panel` (the session's right panel) or `sidebar` (a page in the app's sidebar for the project). The block kinds are `text`, `keyValue`, `metric`, `table`, `list`, `badge`, `alert`, `code`, `progress`, `empty`, `button`, `form` and `link`; the API reference lists their fields and limits.
