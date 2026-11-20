# Command Guard

An AGZ Code plugin that stops the agent from running a few dangerous shell commands. A `tool_call` hook (`src/index.ts`) looks at the `command` argument of the shell tool before it runs and returns `{ block: true, reason }`, so the agent reads why the call failed and can ask you instead. The command `/guard-rules` lists the rules and which are on.

| Rule | Blocks |
|---|---|
| `rm-root` | recursive `rm` of `/`, `~`, `$HOME`, `*` or `.` |
| `git-force-push` | `git push --force` and `-f` (`--force-with-lease` is allowed) |
| `git-reset-hard` | `git reset --hard` |
| `pipe-to-shell` | `curl` or `wget` piped into `sh`, `bash`, `zsh` or `dash` |
| `disk-overwrite` | `dd of=/dev/...`, `mkfs`, a redirect into a disk device |
| `chmod-777` | `chmod -R 777` |

## Settings

- **When a rule matches**: block the command (default), or allow it and show a warning.
- **Rules to turn off**: comma-separated rule ids.
- **Extra pattern**: a regular expression matched, ignoring case, against the whole command, for example `terraform\s+destroy|kubectl\s+delete`. An invalid pattern is ignored and reported once.
- **Shell tools to check**: the tools whose `command` argument is checked; default `bash`.

## This is a safety net, not a sandbox

The rules are patterns over the command text. They catch the usual forms (`rm -rf /`, `git push -f`) but not every way to spell a command: a script file, a variable, `eval` or an encoded string passes. The plugin runs in the engine process and has the engine's rights. Use it next to the approval modes, not instead of them.

## Develop

```sh
npm install
npm test          # agz plugin test: createMockHost, no process is started
npx agz plugin check
```

`test/command-guard.test.ts` lists the commands each rule blocks and the lookalikes it must let through, and drives the hook with `host.emit("tool_call", ...)`. It uses only the public `@agz-yazilim/plugin-sdk` 1.x contract.
