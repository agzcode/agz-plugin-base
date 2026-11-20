# Uptime Monitor

An AGZ Code plugin that checks a list of URLs in the background and tells the agent which ones are down. It shows what an engine module is for: the checks run once for the whole engine, at their own interval, whether or not a session is open, and every session reads the same result.

- `src/engine.ts`: the engine module (`agzPlugin.engine`). It asks every configured URL at the interval of the settings, writes the result to `status.json` in the plugin's data folder and one line per round to `checks.log` in its logs folder. It checks again at once when the user saves the settings, and stops when the engine asks.
- `src/index.ts`: the extension code. It registers the tool `uptime_status`, which reads `status.json` and lists the URLs that are down first.
- `src/checks.ts`: what both parts share: the settings as they read them, one check, and the status file. The two parts are loaded apart and share no variables, so the file in the data folder is where they meet.

## Settings

- **URLs to check**: http or https addresses separated by commas or spaces, at most 20. An address with credentials is refused, and no log line or tool result prints one.
- **Seconds between checks**: 30 to 86400, default 300.
- **Seconds to wait for an answer**: 1 to 60, default 10.

## Permissions

The manifest declares `network`: the plugin talks to the hosts in its settings. The list is what the user reads before installing; the engine does not enforce it.

## Develop

```sh
npm install
npm test          # agz plugin test
npx agz plugin check
```

`test/uptime-monitor.test.ts` replaces `fetch`, runs one round of the engine module with a hand-made engine API, and reads the result through the tool with the kit's mock host over the same storage folder. The engine API types come from `@agz-yazilim/plugin-sdk/unstable`.

Only a plugin of the user scope has an engine module: installed as a project plugin, this plugin's tool would find no status.
