# My Plugin

A skill plugin for AGZ Code: one skill with one script tool.

- `package.json`: the `agzPlugin` manifest declares the skill folder.
- `skills/my-plugin/SKILL.md`: when the skill applies and how to use it.
- `skills/my-plugin/tools/count_words.json` and `scripts/count_words.mjs`: a tool agents call as `tools.skill__my_plugin__count_words(...)` from Code Mode.
- `skills/my-plugin/examples/`: one example per tool, at least three in all, run by the skill tests.
- `test/my-plugin.test.ts`: runs the script tool; `npm test` runs it with `agz plugin test`.

Run `npm install`, then `npx agz plugin check`. Link this folder in Settings > Plugins as a local path, then reload sessions.
