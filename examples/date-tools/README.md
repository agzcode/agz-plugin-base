# Date Tools

An AGZ Code plugin that brings an MCP server for calendar arithmetic, which a language model gets wrong when it counts in its head: the days between two dates, the date some days away, the weekday and ISO week of a date.

The plugin has no extension code. The manifest declares the server (`agzPlugin.mcpServers`), and the engine registers it in every session that loads the plugin.

- `package.json`: declares the server `date-tools`. `${pluginDir}` stands for the installed package folder.
- `server/index.mjs`: the MCP server over stdio, without a dependency.
- `server/dates.mjs`: the arithmetic. Dates are plain calendar days counted in UTC, so a daylight saving change never moves a result.

## Tools

After the user grants the server to an agent (Settings > Agents > Tools, "MCP servers of {agent}"), the agent has:

| Tool | Input | Returns |
|---|---|---|
| `mcp__date_tools__days_between` | `from`, `to` | `days`, `weeks`, `remainingDays` |
| `mcp__date_tools__add_days` | `date`, `days` | `date`, `weekday` |
| `mcp__date_tools__weekday` | `date` | `weekday`, `isoWeek`, `isoYear` |

Dates are `YYYY-MM-DD`. A date that is not a day of the calendar, such as `2025-02-30`, comes back as an error result with the reason.

## Permissions

The manifest declares `process`: the plugin starts a program, its own server, with `node`. `node` must be on the PATH of the machine the engine runs on.

## Develop

```sh
npm install
npm test          # agz plugin test
npx agz plugin check
```

`test/date-tools.test.mjs` tests the arithmetic directly, then starts the server as the manifest declares it and talks to it over stdio.
