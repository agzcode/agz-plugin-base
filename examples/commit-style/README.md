# Commit Style

An AGZ Code plugin that checks a commit message against the rules of the project the session works in. Repositories differ in their commit rules, so the rules are project-scoped settings: each project can keep its own, and the user's values apply everywhere else.

- `src/index.ts`: registers the tool `commit_style_check` and an optional `tool_call` hook that refuses `git commit -m` with a message that breaks the rules.
- `src/rules.ts`: the rules from the settings, the check of one message, and the reading of a `git commit` command.

## Settings

| Setting | Scope | Default |
|---|---|---|
| Subject format: Conventional Commits or plain | project | Conventional Commits |
| Allowed types | project | `feat, fix, docs, refactor, test, chore` |
| Longest subject | project | 72 |
| Refuse git commit with a bad message | user | off |

The first three are declared with `"scope": "project"`. The user's values are in the plugin store, `~/.agz-code/plugins/config/example+commit-style.json`. A project's own values are in the project and travel with its repository:

```json
{ "version": 1, "values": { "format": "plain", "maxSubjectLength": 50 } }
```

in `<project>/.agz-code/plugin-config/example+commit-style.json`. The engine reads that file only in a trusted project. The code never chooses between the two: `getPluginSettings()` returns the value that applies to the session.

The guard is a user setting on purpose: whether a tool call is refused is the user's decision, not the repository's.

## The guard

With the guard on, a `bash` call that runs `git commit` with a quoted `-m` or `--message` value is checked, and refused with the list of problems when the message breaks the rules. A message that cannot be read without running a shell (a variable, a command substitution, `-F file`) passes: the guard does not guess.

## Develop

```sh
npm install
npm test          # agz plugin test
npx agz plugin check
```
