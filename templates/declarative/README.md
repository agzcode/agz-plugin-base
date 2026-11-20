# My Plugin

A plugin for AGZ Code without code. Everything it adds is a file the manifest names: an agent definition, a prompt template, a bot template, an edit of the agents' system prompt and an icon.

- `package.json`: the `agzPlugin` manifest names the files below.
- `agents/my-plugin-reviewer.md`: a subagent profile. `name` must equal the file name; `base` is the agent it builds on (`explorer`, `researcher`, `worker`, `verifier` or `analyst`).
- `prompts/review-change.md`: a prompt template. It becomes the slash command `/review-change`; `${ARGUMENTS:-...}` is the text typed after the command, with a default.
- `bots/reviewer.md`: the brief of a bot template. The Bots page lists the template; the user decides whether to create the bot.
- `system-prompt.json`: one `add` operation that puts a line into the `working` section of every agent's system prompt. Start the id of a new block with the plugin's name, so two plugins do not pick the same one.
- `assets/icon.svg`: the plugin's icon, drawn as an image (at most 32 KB; png, webp or svg).

There is nothing to run, so there is no unit test: `npm test` runs `agz plugin check`, which validates the manifest, every file it names and the package contents.

Run `npm install`, then `npm test`. Link this folder in Settings > Plugins as a local path.
