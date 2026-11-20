# Review Kit

An AGZ Code plugin without a line of code. It adds a way of reviewing changes: two reviewer agents with one job each, two slash commands that use them, and one rule in every agent's system prompt.

- `agents/review-kit-correctness.md`: a subagent that looks for wrong behaviour and reports only what it could show.
- `agents/review-kit-tests.md`: a subagent that asks which test would fail if the change broke.
- `prompts/review.md`: the slash command `/review`. It sends the change to both agents and has the findings checked before they are reported.
- `prompts/review-fix.md`: the slash command `/review-fix`, which fixes the confirmed findings, each with a failing test first.
- `system-prompt.json`: adds one line to the `working` section of every agent's system prompt.
- `assets/icon.svg`: the plugin's icon.

Both agents build on the base agent `verifier`, so they get its tools and its read-only way of working. An agent's `name` equals its file name and starts with the plugin's name, so it cannot collide with an agent of another plugin.

## Use

Install the plugin, reload the sessions, and type `/review` in a session, or `/review src/parser.ts` to name what to review. `/review-fix` afterwards fixes what was confirmed.

## Develop

```sh
npm install
npm test          # agz plugin check
```

There is no code to test, so `npm test` runs `agz plugin check`: it validates the manifest, every file it names (the agents' front matter, the system prompt edits, the icon) and the package contents.
