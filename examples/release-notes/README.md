# Release Notes

An AGZ Code plugin without extension code: it ships data the host reads from the manifest.

- **A skill** (`skills/release-notes`): the procedure for writing release notes from git history, and the tool `group_commits`, a script that groups Conventional Commit subjects into Added, Fixed, Changed, Documentation and Other, lists breaking changes first and counts the housekeeping commits it leaves out. It has three examples.
- **A system prompt edit** (`system-prompt.json`, `agzPlugin.systemPrompt`): one block added to the prompt's `working` section, telling every agent to load the skill for release notes and to write only changes the history shows.
- **A bot template** (`agzPlugin.contributes["agz/bots/templates"]`, brief in `bots/weekly-notes.md`): the Bots page offers a `release-notes-bot` the user can create; nothing runs until they do.

## Use

Link the folder in Settings > Plugins as a local path and reload sessions. Ask the agent for the release notes since the last tag, or create the bot from the Bots page.

## Develop

```sh
npm install
npm test          # agz plugin test
npx agz plugin check
```

`test/release-notes.test.ts` runs the tool's script on its examples, checks the system prompt file against the SDK's `PluginSystemPrompt` type and the bot template's brief, and uses `createMockHost` to confirm that the plugin registers nothing. It uses only the public `@agz-yazilim/plugin-sdk` 1.x contract.
